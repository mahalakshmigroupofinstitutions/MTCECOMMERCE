import Link from "next/link";
import type { ReactNode } from "react";

export interface OnboardingSummaryRow {
  label: string;
  value: ReactNode;
}

/** Read-only key/value block. Used by the vendor's own review step (with an
 * Edit link) and by the admin submission detail page (without one). */
export function OnboardingSummarySection({
  title,
  editHref,
  rows,
}: {
  title: string;
  editHref?: string;
  rows: OnboardingSummaryRow[];
}) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13.5px] font-extrabold text-ink">{title}</h2>
        {editHref && (
          <Link href={editHref} className="text-[12.5px] font-bold text-ink underline">
            Edit
          </Link>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11px] font-semibold text-faint">{row.label}</dt>
            <dd className="text-[13px] text-ink">{row.value || <span className="text-faint">—</span>}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
