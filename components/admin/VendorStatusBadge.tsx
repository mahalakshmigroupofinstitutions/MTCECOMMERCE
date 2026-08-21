import type { SupplierOnboardingStatus } from "@/lib/generated/prisma/client";

const STATUS_STYLES: Record<SupplierOnboardingStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "border-line bg-wash text-faint" },
  PENDING_VERIFICATION: { label: "Pending", className: "border-accent/30 bg-accent/10 text-accent" },
  UNDER_REVIEW: { label: "Under review", className: "border-ink/20 bg-wash text-ink" },
  CHANGES_REQUESTED: { label: "Changes requested", className: "border-accent/30 bg-accent/10 text-accent" },
  APPROVED: { label: "Approved", className: "border-ink bg-ink text-white" },
  REJECTED: { label: "Rejected", className: "border-line bg-paper text-sub line-through" },
};

export function VendorStatusBadge({ status }: { status: SupplierOnboardingStatus }) {
  const { label, className } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${className}`}>
      {label}
    </span>
  );
}
