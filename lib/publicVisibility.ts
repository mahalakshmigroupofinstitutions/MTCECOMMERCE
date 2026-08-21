/* The single definition of what buyers can discover.
 *
 * Both the buyer catalog (lib/catalog.ts) and the vendor-side shop helpers
 * (lib/vendorShop.ts) compose these fragments, so there is exactly one place
 * where "publicly visible" is decided. Do not inline equivalent filters
 * elsewhere — a second copy is how the two sides drift apart.
 *
 * These are Prisma `where` fragments, not queries, so this module stays free of
 * server-only imports and can be reused anywhere. */
import type { Prisma } from "@/lib/generated/prisma/client";

/** Product statuses a buyer may see.
 *
 * OUT_OF_STOCK stays visible on purpose: in B2B an unavailable line is still
 * worth an RFQ for bulk or future procurement. DRAFT (never released) and
 * ARCHIVED (withdrawn) are never buyer-visible. */
export const PUBLIC_PRODUCT_STATUSES = ["PUBLISHED", "OUT_OF_STOCK"] as const;

export const publicProductWhere = {
  status: { in: [...PUBLIC_PRODUCT_STATUSES] },
} satisfies Prisma.ProductWhereInput;

/** Publish-gated supplier visibility, with a grace period for suppliers who
 * predate Shop Setup.
 *
 * A supplier is discoverable when they are APPROVED and any of:
 *   - they have no Shop row at all (suppliers created before Shop Setup);
 *   - their Shop has never been published. getOrCreateShop() writes a DRAFT row
 *     the first time a vendor merely *opens* Shop Setup, and that must never
 *     take a working storefront offline;
 *   - their Shop is currently LIVE.
 *
 * Once a shop has been published even once, publishedAt is set and Shop.status
 * becomes the authority — so unpublishing genuinely removes the storefront.
 *
 * Note there is deliberately no "has a published product" condition: approved
 * suppliers with an empty catalog are visible today and must stay that way. */
export const publicSupplierWhere = {
  onboardingStatus: "APPROVED",
  OR: [{ shop: { is: null } }, { shop: { is: { publishedAt: null } } }, { shop: { is: { status: "LIVE" } } }],
} satisfies Prisma.SupplierWhereInput;

/** A product is discoverable only if it is public *and* its supplier is. */
export const publicProductWithSupplierWhere = {
  ...publicProductWhere,
  supplier: { is: publicSupplierWhere },
} satisfies Prisma.ProductWhereInput;

/** Same rule as publicSupplierWhere, expressed from the Shop side. */
export const publicShopWhere = {
  OR: [{ publishedAt: null }, { status: "LIVE" }],
  supplier: { is: { onboardingStatus: "APPROVED" } },
} satisfies Prisma.ShopWhereInput;
