/* Integration tests for Shop.website ownership.
 * Run with: npm test
 *
 * These hit the real database because the thing under test is persistence:
 * which step writes which column. They create one clearly-namespaced throwaway
 * supplier and delete it (and its shop) in a finally block, so the database is
 * left exactly as found even if an assertion fails. No schema is touched.
 *
 * Skips itself when DATABASE_URL is absent, so the pure unit suite in
 * vendorShop.test.ts still runs without a database. */
import "dotenv/config";
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { getSupplierBySlug } from "@/lib/catalog";
import {
  canPublishShop,
  getOrCreateShop,
  getPublicShopBySupplierSlug,
  getShopCompletion,
  saveShopBusiness,
  saveShopDelivery,
  saveShopPolicies,
  saveShopSocial,
  toPublicShop,
} from "@/lib/vendorShop";

const BUSINESS_WEBSITE = "https://owned-by-business.example/";

const VALID_BUSINESS = {
  businessEmail: "biz@example.test",
  hoursOpen: "09:00",
  hoursClose: "18:00",
  workingDays: ["MON", "TUE"],
  addressLine: "Plot 12, MIDC",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411026",
};

const ALL_SOCIALS = {
  linkedinUrl: "linkedin.com/company/acme",
  facebookUrl: "facebook.com/acme",
  instagramUrl: "instagram.com/acme",
  youtubeUrl: "youtube.com/@acme",
  whatsappNumber: "9876543210",
};

after(async () => {
  await prisma.$disconnect();
});

test(
  "Shop.website is owned by Business Details, not Social Links",
  { skip: process.env.DATABASE_URL ? false : "DATABASE_URL not set" },
  async (t) => {
    const stamp = Date.now();
    const supplier = await prisma.supplier.create({
      data: {
        name: "ZZ Ownership Test Vendor",
        city: "Pune",
        slug: `zz-ownership-${stamp}`,
        phone: `+9190${stamp.toString().slice(-8)}`,
        email: `zz-ownership-${stamp}@example.test`,
        onboardingStatus: "APPROVED",
        tags: [],
      },
    });

    const websiteOf = async () =>
      (await prisma.shop.findUniqueOrThrow({ where: { supplierId: supplier.id } })).website;

    try {
      const fresh = await getOrCreateShop(supplier.id);
      assert.equal(fresh.website, null, "precondition: no website yet");

      await t.test("Business Details writes Shop.website", async () => {
        const result = await saveShopBusiness(supplier.id, { ...VALID_BUSINESS, website: BUSINESS_WEBSITE });
        assert.ok("shop" in result, "business save should succeed");
        assert.equal(await websiteOf(), BUSINESS_WEBSITE);
      });

      await t.test("saving Social Links leaves the business website unchanged", async () => {
        const result = await saveShopSocial(supplier.id, ALL_SOCIALS);
        assert.ok("shop" in result, "social save should succeed");
        assert.equal(await websiteOf(), BUSINESS_WEBSITE, "Social Links must not overwrite Shop.website");
      });

      await t.test("clearing every social field still leaves the website intact", async () => {
        const result = await saveShopSocial(supplier.id, {});
        assert.ok("shop" in result);
        assert.equal(await websiteOf(), BUSINESS_WEBSITE, "an empty Social save must not null Shop.website");
      });

      await t.test("Social Links persists all five social fields", async () => {
        const result = await saveShopSocial(supplier.id, ALL_SOCIALS);
        assert.ok("shop" in result);

        const shop = result.shop;
        assert.equal(shop.linkedinUrl, "https://linkedin.com/company/acme");
        assert.equal(shop.facebookUrl, "https://facebook.com/acme");
        assert.equal(shop.instagramUrl, "https://instagram.com/acme");
        assert.equal(shop.youtubeUrl, "https://youtube.com/@acme");
        assert.equal(shop.whatsappNumber, "+919876543210");
      });

      await t.test("social completion depends only on the five social fields", async () => {
        const withSocials = await getOrCreateShop(supplier.id);
        assert.equal(getShopCompletion(withSocials).steps.social, true);

        // Clear the socials; the business website survives but Social must not.
        await saveShopSocial(supplier.id, {});
        const cleared = await getOrCreateShop(supplier.id);
        assert.equal(cleared.website, BUSINESS_WEBSITE, "website still set");
        assert.equal(
          getShopCompletion(cleared).steps.social,
          false,
          "a business website alone must not complete Social",
        );
      });

      await t.test("Business Details remains able to change its own website", async () => {
        const result = await saveShopBusiness(supplier.id, { ...VALID_BUSINESS, website: "acme-updated.example" });
        assert.ok("shop" in result);
        assert.equal(await websiteOf(), "https://acme-updated.example/");
      });
    } finally {
      await prisma.shop.deleteMany({ where: { supplierId: supplier.id } });
      await prisma.supplier.deleteMany({ where: { id: supplier.id } });
    }
  },
);

/* The on-hold steps keep their columns and their saved data. What must never
 * happen is that data reaching a storefront view — the vendor Preview or the
 * buyer supplier page. Both read through helpers exercised here, against a real
 * shop whose out-of-scope columns are all populated. */
test(
  "on-hold shop data is stored but never reaches a storefront payload",
  { skip: process.env.DATABASE_URL ? false : "DATABASE_URL not set" },
  async (t) => {
    const stamp = Date.now();
    const slug = `zz-hidden-${stamp}`;
    const supplier = await prisma.supplier.create({
      data: {
        name: "ZZ Hidden Fields Vendor",
        city: "Pune",
        slug,
        phone: `+9191${stamp.toString().slice(-8)}`,
        email: `zz-hidden-${stamp}@example.test`,
        onboardingStatus: "APPROVED",
        tags: [],
      },
    });

    /* Sentinels rather than realistic copy: any of these appearing anywhere in a
     * serialized payload is a leak, wherever it came from. */
    const SENTINELS = [
      "leaked-website",
      "leaked-linkedin",
      "leaked-facebook",
      "leaked-instagram",
      "leaked-youtube",
      "919876500001",
      "leaked-area",
      "leaked-charges",
      "leaked-eta",
      "leaked-dispatch",
      "leaked-return",
      "leaked-refund",
      "leaked-cancellation",
      "leaked-warranty",
    ];

    const assertNoLeak = (label: string, payload: unknown) => {
      const serialized = JSON.stringify(payload);
      for (const sentinel of SENTINELS) {
        assert.ok(!serialized.includes(sentinel), `${label} leaked ${sentinel}`);
      }
    };

    try {
      await getOrCreateShop(supplier.id);

      await t.test("a vendor can still save every on-hold section", async () => {
        const business = await saveShopBusiness(supplier.id, {
          businessEmail: "biz@example.test",
          website: "leaked-website.example",
          hoursOpen: "09:00",
          hoursClose: "18:00",
          workingDays: ["MON"],
          addressLine: "Plot 12, MIDC",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411026",
        });
        assert.ok("shop" in business, "business save should succeed");

        const social = await saveShopSocial(supplier.id, {
          linkedinUrl: "linkedin.com/company/leaked-linkedin",
          facebookUrl: "facebook.com/leaked-facebook",
          instagramUrl: "instagram.com/leaked-instagram",
          youtubeUrl: "youtube.com/@leaked-youtube",
          whatsappNumber: "9876500001",
        });
        assert.ok("shop" in social, "social save should succeed");

        const delivery = await saveShopDelivery(supplier.id, {
          deliveryAreas: ["leaked-area"],
          shippingMethods: ["SURFACE"],
          deliveryCharges: "leaked-charges",
          deliveryEta: "leaked-eta",
          selfPickup: true,
          dispatchAddress: "leaked-dispatch",
        });
        assert.ok("shop" in delivery, "delivery save should succeed");

        const policies = await saveShopPolicies(supplier.id, {
          returnPolicy: "leaked-return",
          refundPolicy: "leaked-refund",
          cancellationPolicy: "leaked-cancellation",
          warrantyInfo: "leaked-warranty",
        });
        assert.ok("shop" in policies, "policies save should succeed");
      });

      await t.test("the data really is persisted — this is a visibility change, not a deletion", async () => {
        const stored = await prisma.shop.findUniqueOrThrow({ where: { supplierId: supplier.id } });

        assert.equal(stored.website, "https://leaked-website.example/");
        assert.equal(stored.linkedinUrl, "https://linkedin.com/company/leaked-linkedin");
        assert.equal(stored.whatsappNumber, "+919876500001");
        assert.deepEqual(stored.deliveryAreas, ["leaked-area"]);
        assert.equal(stored.deliveryEta, "leaked-eta");
        assert.equal(stored.dispatchAddress, "leaked-dispatch");
        assert.equal(stored.returnPolicy, "leaked-return");
        assert.equal(stored.warrantyInfo, "leaked-warranty");
      });

      await t.test("the vendor Preview payload carries none of it", async () => {
        // Exactly what app/vendor/shop/preview/page.tsx renders from.
        const previewShop = toPublicShop(await getOrCreateShop(supplier.id));

        assertNoLeak("vendor preview", previewShop);
        // ...while still carrying what the Preview does show.
        assert.equal(previewShop.name, "ZZ Hidden Fields Vendor");
        assert.equal(previewShop.hoursOpen, "09:00");
        assert.equal(previewShop.city, "Pune");
      });

      await t.test("the buyer storefront payload carries none of it", async () => {
        // The supplier page reads this and nothing else; it never loads a Shop.
        const storefront = await getSupplierBySlug(slug);
        assert.ok(storefront, "the approved supplier should be publicly visible");
        assertNoLeak("buyer storefront", storefront);

        // And the public Shop lookup, if a view ever adopts it, is stripped too.
        const publicShop = await getPublicShopBySupplierSlug(slug);
        assert.ok(publicShop, "an approved, never-published shop is publicly reachable");
        assertNoLeak("public shop lookup", publicShop);
      });

      await t.test("active setup, publishing rules and authorization are unaffected", async () => {
        const shop = await getOrCreateShop(supplier.id);
        const completion = getShopCompletion(shop);

        // Business is saved; basics (no category/description) and branding (no
        // logo) are not, so the shop is correctly still incomplete — all that
        // on-hold data didn't quietly complete anything.
        assert.equal(completion.steps.business, true);
        assert.deepEqual(completion.missingRequired, ["basics", "branding"]);

        const eligibility = await canPublishShop(supplier.id);
        assert.equal(eligibility.ok, false);
        assert.ok(eligibility.blockers.includes("setupIncomplete"));
        assert.ok(eligibility.blockers.includes("noPublishedProduct"));
        // Approval is genuine and must not be re-derived from shop data.
        assert.ok(!eligibility.blockers.includes("notApproved"));
      });
    } finally {
      await prisma.shop.deleteMany({ where: { supplierId: supplier.id } });
      await prisma.supplier.deleteMany({ where: { id: supplier.id } });
    }
  },
);
