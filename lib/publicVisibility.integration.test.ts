/* Integration tests for buyer-facing visibility.
 * Run with: npm test
 *
 * These hit the real database because the subject is query behaviour: which
 * rows a buyer can reach. Every row is created under a "ZZ Vis" namespace and
 * removed in a finally block, so the database is left exactly as found even if
 * an assertion fails. No schema is touched.
 *
 * Skips itself when DATABASE_URL is absent. */
import "dotenv/config";
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { getCatalogStats, getProductBySlug, getSupplierBySlug, searchProducts } from "@/lib/catalog";
import { publishShop, unpublishShop } from "@/lib/vendorShop";
import { getVendorProducts } from "@/lib/vendor";
import type { ProductStatus, SupplierOnboardingStatus } from "@/lib/generated/prisma/client";

const TAG = "ZZ Vis";

after(async () => {
  await prisma.$disconnect();
});

test(
  "buyer visibility: product status and shop publication",
  { skip: process.env.DATABASE_URL ? false : "DATABASE_URL not set" },
  async (t) => {
    const stamp = Date.now();
    const category = await prisma.category.findFirstOrThrow();
    let n = 0;

    const mkSupplier = async (label: string, onboardingStatus: SupplierOnboardingStatus) =>
      prisma.supplier.create({
        data: {
          name: `${TAG} ${label}`,
          city: `${TAG}ville`,
          slug: `zz-vis-${label.toLowerCase()}-${stamp}`,
          phone: `+9170${String(stamp).slice(-6)}${n++}`,
          email: `zz-vis-${label.toLowerCase()}-${stamp}@example.test`,
          onboardingStatus,
          tags: [],
        },
      });

    const mkProduct = (supplierId: string, label: string, status: ProductStatus) =>
      prisma.product.create({
        data: {
          slug: `zz-vis-${label}-${stamp}`,
          title: `${TAG} ${label}`,
          supplierId,
          categoryId: category.id,
          unit: "kg",
          price: 100,
          moq: 1,
          moqUnit: "kg",
          status,
        },
      });

    const mkShop = (supplierId: string, name: string) =>
      prisma.shop.create({ data: { supplierId, name: `${TAG} ${name}` } });

    // Legacy: approved, no Shop row at all — the 9 real suppliers look like this.
    const legacy = await mkSupplier("Legacy", "APPROVED");
    // Draft: approved, has a Shop that has never been published.
    const draft = await mkSupplier("Draft", "APPROVED");
    // Publisher: will publish, then unpublish.
    const publisher = await mkSupplier("Publisher", "APPROVED");
    // Unapproved: will get a LIVE shop but must never be visible.
    const unapproved = await mkSupplier("Unapproved", "PENDING_VERIFICATION");

    const supplierIds = [legacy.id, draft.id, publisher.id, unapproved.id];

    try {
      await mkShop(draft.id, "DraftShop");
      await mkShop(publisher.id, "PubShop");
      await mkShop(unapproved.id, "UnapprovedShop");

      const pub = await mkProduct(legacy.id, "published", "PUBLISHED");
      const oos = await mkProduct(legacy.id, "oos", "OUT_OF_STOCK");
      const drf = await mkProduct(legacy.id, "draft", "DRAFT");
      const arc = await mkProduct(legacy.id, "archived", "ARCHIVED");
      await mkProduct(publisher.id, "pubowned", "PUBLISHED");
      await mkProduct(unapproved.id, "unapprovedowned", "PUBLISHED");

      const searchSlugs = async () =>
        (await searchProducts({ q: TAG })).products.map((p) => p.slug);

      await t.test("PUBLISHED and OUT_OF_STOCK are buyer-visible; DRAFT and ARCHIVED are not", async () => {
        const slugs = await searchSlugs();
        assert.ok(slugs.includes(pub.slug), "PUBLISHED visible");
        assert.ok(slugs.includes(oos.slug), "OUT_OF_STOCK visible");
        assert.ok(!slugs.includes(drf.slug), "DRAFT hidden");
        assert.ok(!slugs.includes(arc.slug), "ARCHIVED hidden");
      });

      await t.test("product detail honours the same rule", async () => {
        assert.ok(await getProductBySlug(pub.slug), "PUBLISHED reachable");
        assert.ok(await getProductBySlug(oos.slug), "OUT_OF_STOCK reachable");
        assert.equal(await getProductBySlug(drf.slug), null, "DRAFT not reachable");
        assert.equal(await getProductBySlug(arc.slug), null, "ARCHIVED not reachable");
      });

      await t.test("the vendor still sees all four of their own products", async () => {
        const mine = await getVendorProducts(legacy.id);
        const statuses = mine.map((p) => p.status).sort();
        assert.deepEqual(statuses, ["ARCHIVED", "DRAFT", "OUT_OF_STOCK", "PUBLISHED"]);
      });

      await t.test("legacy supplier with no Shop stays visible", async () => {
        const found = await getSupplierBySlug(legacy.slug);
        assert.ok(found, "legacy storefront reachable");
        // ...and its catalog is filtered the same way.
        const slugs = found.products.map((p) => p.slug);
        assert.ok(slugs.includes(pub.slug) && slugs.includes(oos.slug));
        assert.ok(!slugs.includes(drf.slug) && !slugs.includes(arc.slug));
      });

      await t.test("supplier whose DRAFT Shop was auto-created stays visible", async () => {
        assert.ok(await getSupplierBySlug(draft.slug), "opening Shop Setup must not hide a storefront");
      });

      await t.test("unapproved supplier is invisible even with a LIVE shop", async () => {
        await prisma.shop.update({
          where: { supplierId: unapproved.id },
          data: { status: "LIVE", publishedAt: new Date() },
        });
        assert.equal(await getSupplierBySlug(unapproved.slug), null);
        const slugs = await searchSlugs();
        assert.ok(!slugs.includes(`zz-vis-unapprovedowned-${stamp}`), "their products stay hidden too");
      });

      await t.test("publish makes a shop live; unpublish hides it", async () => {
        // Publisher needs complete setup to satisfy publishShop, so drive the
        // status directly here — publishShop's own gate is covered elsewhere.
        await prisma.shop.update({
          where: { supplierId: publisher.id },
          data: { status: "LIVE", publishedAt: new Date() },
        });
        assert.ok(await getSupplierBySlug(publisher.slug), "LIVE shop visible");

        await unpublishShop(publisher.id);
        assert.equal(await getSupplierBySlug(publisher.slug), null, "unpublished shop hidden");

        const slugs = await searchSlugs();
        assert.ok(!slugs.includes(`zz-vis-pubowned-${stamp}`), "their products drop out of search too");
      });

      await t.test("unpublishing does not change any Product.status", async () => {
        const statuses = await prisma.product.findMany({
          where: { supplierId: publisher.id },
          select: { status: true },
        });
        assert.deepEqual(
          statuses.map((s) => s.status),
          ["PUBLISHED"],
          "product statuses survive unpublish",
        );
      });

      await t.test("publishShop refuses an ineligible shop and leaves it hidden", async () => {
        // publisher is HIDDEN with incomplete setup — the gate must hold.
        const result = await publishShop(publisher.id);
        assert.ok("error" in result, "ineligible publish rejected");
        assert.equal(await getSupplierBySlug(publisher.slug), null);
      });

      await t.test("catalog stats count only buyer-visible rows", async () => {
        const stats = await getCatalogStats();
        const visibleProducts = await prisma.product.count({
          where: {
            status: { in: ["PUBLISHED", "OUT_OF_STOCK"] },
            supplier: {
              is: {
                onboardingStatus: "APPROVED",
                OR: [{ shop: { is: null } }, { shop: { is: { publishedAt: null } } }, { shop: { is: { status: "LIVE" } } }],
              },
            },
          },
        });
        assert.equal(stats.products, visibleProducts, "product count matches the visibility rule");
        assert.ok(stats.suppliers > 0);

        // The hidden publisher and the unapproved supplier must not be counted.
        const allSuppliers = await prisma.supplier.count();
        assert.ok(stats.suppliers < allSuppliers, "unapproved/hidden suppliers excluded");
      });
    } finally {
      await prisma.product.deleteMany({ where: { supplierId: { in: supplierIds } } });
      await prisma.shop.deleteMany({ where: { supplierId: { in: supplierIds } } });
      await prisma.supplier.deleteMany({ where: { id: { in: supplierIds } } });
    }
  },
);
