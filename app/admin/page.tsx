import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { VendorStatusBadge } from "@/components/admin/VendorStatusBadge";
import {
  requireAdmin,
  getVendorQueue,
  getQueueCounts,
  REVIEW_QUEUE_STATUSES,
  STATUS_LABELS,
  type ReviewQueueStatus,
} from "@/lib/adminReview";

export const revalidate = 0;

function isQueueStatus(value: string | undefined): value is ReviewQueueStatus {
  return !!value && (REVIEW_QUEUE_STATUSES as readonly string[]).includes(value);
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const { status } = await searchParams;
  const activeStatus: ReviewQueueStatus = isQueueStatus(status) ? status : "PENDING_VERIFICATION";

  const [vendors, counts] = await Promise.all([getVendorQueue(activeStatus), getQueueCounts()]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <h1 className="text-xl font-extrabold text-ink">Vendor verification</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Review submitted vendor applications and decide whether they go live on the marketplace.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        {REVIEW_QUEUE_STATUSES.map((s) => {
          const active = s === activeStatus;
          return (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150 ${
                active ? "border-accent bg-accent text-white" : "border-line bg-paper text-ink hover:border-ink"
              }`}
            >
              {STATUS_LABELS[s]}
              <span className={active ? "text-white/80" : "text-faint"}>{counts[s]}</span>
            </Link>
          );
        })}
      </nav>

      {vendors.length === 0 ? (
        <div className="mt-7 rounded-2xl border border-line bg-wash p-6 text-center">
          <p className="text-[13.5px] font-bold text-ink">Nothing here</p>
          <p className="mt-1 text-[12.5px] text-sub">No vendors currently have this status.</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <Link
                href={`/admin/vendors/${vendor.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line p-4 transition-colors duration-150 hover:border-ink"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-extrabold text-ink">{vendor.name}</span>
                    <VendorStatusBadge status={vendor.onboardingStatus} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-sub">
                    {vendor.email && (
                      <span className="flex items-center gap-1">
                        <Icon name="mail" size={12} /> {vendor.email}
                      </span>
                    )}
                    {vendor.city && (
                      <span className="flex items-center gap-1">
                        <Icon name="pin" size={12} /> {vendor.city}
                      </span>
                    )}
                    {vendor.businessCategory && <span>{vendor.businessCategory.name}</span>}
                  </div>
                </div>

                <div className="text-right text-[11.5px] text-faint">
                  {vendor.reviewedAt ? (
                    <>
                      Reviewed {vendor.reviewedAt.toLocaleDateString()}
                      {vendor.reviewedBy && <div>by {vendor.reviewedBy.name}</div>}
                    </>
                  ) : (
                    <>Submitted {vendor.updatedAt.toLocaleDateString()}</>
                  )}
                </div>
                <Icon name="chevron-right" size={16} className="text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
