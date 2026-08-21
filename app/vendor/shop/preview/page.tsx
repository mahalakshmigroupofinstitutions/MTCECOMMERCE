/* Vendor-only preview of the storefront.
 *
 * Authenticated exactly like every other Shop Setup page, and scoped to the
 * vendor's own shop — there is no slug or id parameter, so there is nothing to
 * tamper with to see someone else's. It renders through the SAME public
 * visibility rules the buyer storefront uses (lib/publicVisibility.ts), so what
 * the vendor sees here is what buyers get.
 *
 * The shop is read through toPublicShop(), so the columns belonging to the
 * on-hold steps (website, social links, delivery, policies) aren't merely
 * unrendered — they never reach this component, and referencing one is a type
 * error. The data itself is untouched in the database.
 *
 * Certifications appear as type + title only. No document link, no file path,
 * no supplier id — those stay behind the authenticated API route. */
import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { CatalogImage, Metric, Stars, VerifiedBadge, buttonClassName } from "@/components/ui";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Tag } from "@/components/catalog/Tag";
import { STORE_URL_HOST } from "@/components/vendor/shopSetupMeta";
import { ShopStatusBadge } from "@/components/vendor/ShopStatusBadge";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import {
  WORKING_DAYS,
  getOrCreateShop,
  getPublicProductsForSupplier,
  isShopPubliclyVisible,
  toPublicShop,
} from "@/lib/vendorShop";
import type { ShopCertificationType } from "@/lib/generated/prisma/client";

export const revalidate = 0;

const DAY_LABELS: Record<(typeof WORKING_DAYS)[number], string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const CERT_LABELS: Record<ShopCertificationType, string> = {
  ISO: "ISO certificate",
  MSME: "MSME / Udyam registration",
  BIS: "BIS certification",
  AUTHORIZED_DEALER: "Authorised dealer letter",
  COMPANY_BROCHURE: "Company brochure",
  PROJECT_PORTFOLIO: "Project portfolio",
  OTHER: "Certification",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <h3 className="mb-3 text-[15px] font-extrabold text-ink">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[13px]">
      <span className="text-sub">{label}: </span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export default async function ShopPreviewPage() {
  const supplier = await requireVendorForShopSetup("/vendor/shop/preview");

  const [fullShop, products, publiclyVisible] = await Promise.all([
    getOrCreateShop(supplier.id),
    getPublicProductsForSupplier(supplier.id),
    isShopPubliclyVisible(supplier.id),
  ]);
  // Everything below renders from the stripped shape only.
  const shop = toPublicShop(fullShop);

  const hours = shop.hoursOpen && shop.hoursClose ? `${shop.hoursOpen} – ${shop.hoursClose}` : null;
  const days = shop.workingDays.map((d) => DAY_LABELS[d as (typeof WORKING_DAYS)[number]] ?? d).join(", ");
  const location = [shop.city, shop.state, shop.pincode].filter(Boolean).join(", ");

  return (
    <div className="pb-10">
      {/* Vendor-only chrome. Everything below the divider is what buyers see. */}
      <div className="border-b border-line bg-wash">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <Link href="/vendor/shop" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sub">
            <Icon name="arrow-left" size={14} strokeWidth={2} /> Back to Shop Setup
          </Link>
          <span className="text-[12.5px] font-bold text-ink">Preview</span>
          <span className="text-[11.5px] text-sub">
            {publiclyVisible ? "This is live to buyers now." : "Only you can see this — your shop isn't live yet."}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ShopStatusBadge onboardingStatus={supplier.onboardingStatus} shopStatus={shop.status} />
          </div>
        </div>
      </div>

      <CatalogImage src={shop.bannerUrl} label={`${shop.name} · Cover`} height={180} rounded={false} sizes="100vw" />

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start gap-4 pt-5 sm:flex-row sm:items-center sm:gap-5">
          <div className="-mt-14 h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-paper bg-ink shadow-sm sm:-mt-16">
            {shop.logoUrl ? (
              <CatalogImage src={shop.logoUrl} label={shop.name} height={72} rounded={false} sizes="80px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-white">
                {shop.name[0]}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{shop.name}</h1>
              <VerifiedBadge show={supplier.verified} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-sub">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="pin" size={14} /> {location}
                </span>
              )}
              {shop.category && <span>{shop.category.name}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Stars value={supplier.trustScore} size={13} /> ({supplier.reviewsCount} reviews)
              </span>
            </div>
            <div className="mt-1 font-mono text-[11.5px] text-faint">
              {STORE_URL_HOST}/supplier/{supplier.slug}
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="star" value={supplier.trustScore.toFixed(1)} label="Trust score" />
          </div>
          {/* Was "Delivery time" from Shop.deliveryEta — Delivery is on hold, so
              this mirrors the buyer storefront's Avg response tile instead. */}
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="clock" value={supplier.responseTime ?? "—"} label="Avg response" />
          </div>
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="truck" value={`${supplier.deliveryPercent}%`} label="On-time delivery" />
          </div>
          <div className="rounded-2xl border border-line py-3">
            <Metric icon="shield" value={`${supplier.years} yrs`} label="In business" />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-extrabold text-ink">Catalog &middot; {products.length} products</h2>
            </div>
            {products.length === 0 ? (
              <div className="rounded-2xl border border-line p-8 text-center text-sm text-sub">
                No products are visible to buyers yet.
                <Link href="/vendor/products" className="mt-3 block font-bold text-ink underline">
                  Manage your products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* No Policies section: Policies is on hold and its columns are not
                part of PublicShop. The stored text is untouched. */}
          </div>

          <aside className="flex flex-shrink-0 flex-col gap-4 md:w-72">
            <Section title="About">
              {shop.description && <p className="text-[13.5px] leading-relaxed text-sub">{shop.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {supplier.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4">
                {shop.supportEmail && <Field label="Email" value={shop.supportEmail} />}
                {shop.supportPhone && <Field label="Phone" value={shop.supportPhone} />}
                {hours && <Field label="Hours" value={hours} />}
                {days && <Field label="Open" value={days} />}
              </div>
            </Section>

            {/* No Delivery section: Delivery is on hold and its columns are not
                part of PublicShop. The stored areas and methods are untouched. */}

            {shop.certifications.length > 0 && (
              <Section title="Certifications">
                {/* Metadata only — the documents themselves are private and are
                    never linked from a buyer-facing view. */}
                <ul className="flex flex-col gap-2.5">
                  {shop.certifications.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <Icon name="verified" size={15} className="mt-px shrink-0 text-ink" />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-ink">{CERT_LABELS[c.type]}</span>
                        {c.title && <span className="block text-[12px] text-sub">{c.title}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* No "Find us" section: Social Links is on hold, and neither the
                handles nor Shop.website are part of PublicShop. */}
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/vendor/shop" className={buttonClassName({ variant: "outline", size: "sm" })}>
            <Icon name="arrow-left" size={15} strokeWidth={2} /> Back to Shop Setup
          </Link>
          <Link href="/vendor/shop/basics" className={buttonClassName({ variant: "ghost", size: "sm" })}>
            Edit shop details
          </Link>
        </div>
      </div>
    </div>
  );
}
