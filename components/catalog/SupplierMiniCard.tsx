import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import type { SupplierRow } from "@/lib/catalog";

export function SupplierMiniCard({ supplier }: { supplier: SupplierRow }) {
  return (
    <Link
      href={`/supplier/${supplier.slug}`}
      className="mt-4 flex items-center gap-3.5 rounded-2xl border border-line p-3.5"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-lg font-extrabold text-white">
        {supplier.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-extrabold text-ink">{supplier.name}</span>
          {supplier.verified && <Icon name="verified" size={14} />}
        </div>
        <div className="mt-0.5 text-[12px] text-sub">
          {supplier.city.split(",")[0]} &middot; {supplier.years} yrs &middot; &#9733; {supplier.trustScore} &middot; responds{" "}
          {supplier.responseTime}
        </div>
      </div>
      <Icon name="chevron-right" size={18} className="flex-shrink-0 text-faint" />
    </Link>
  );
}
