import type { ShopStatus, SupplierOnboardingStatus } from "@/lib/generated/prisma/client";

/* Reads the two existing status systems rather than inventing a third: the
 * vendor's verification state (Supplier.onboardingStatus) outranks the
 * storefront's own lifecycle (Shop.status), because an unapproved vendor's
 * shop can never be buyer-visible whatever the shop itself says. */

const VERIFICATION_LABELS: Partial<Record<SupplierOnboardingStatus, string>> = {
  DRAFT: "Account setup incomplete",
  PENDING_VERIFICATION: "Pending verification",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Not approved",
};

const SHOP_LABELS: Record<ShopStatus, string> = {
  DRAFT: "Shop setup not started",
  INCOMPLETE: "Shop setup incomplete",
  READY: "Ready to publish",
  LIVE: "Live",
  HIDDEN: "Hidden from buyers",
};

export function shopStatusLabel(onboardingStatus: SupplierOnboardingStatus, shopStatus: ShopStatus): string {
  return VERIFICATION_LABELS[onboardingStatus] ?? SHOP_LABELS[shopStatus];
}

export function ShopStatusBadge({
  onboardingStatus,
  shopStatus,
}: {
  onboardingStatus: SupplierOnboardingStatus;
  shopStatus: ShopStatus;
}) {
  const label = shopStatusLabel(onboardingStatus, shopStatus);
  const isLive = onboardingStatus === "APPROVED" && shopStatus === "LIVE";
  const isReady = onboardingStatus === "APPROVED" && shopStatus === "READY";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold ${
        isLive ? "bg-ink text-white" : isReady ? "border border-accent text-accent" : "bg-wash text-sub"
      }`}
    >
      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      {label}
    </span>
  );
}
