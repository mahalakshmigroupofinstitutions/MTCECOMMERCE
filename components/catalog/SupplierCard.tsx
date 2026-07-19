import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { CatalogImage, Stars, VerifiedBadge, cardHoverClassName } from "@/components/ui";
import type { SupplierRow } from "@/lib/catalog";

export function SupplierCard({ supplier }: { supplier: SupplierRow }) {
  return (
    <Link
      href={`/supplier/${supplier.slug}`}
      className={`group flex w-[250px] flex-shrink-0 flex-col gap-2.5 rounded-2xl border border-line p-3.5 sm:w-auto ${cardHoverClassName}`}
    >
      <CatalogImage src={supplier.imageUrl} label={supplier.name} height={92} />
      <div className="flex items-center justify-between gap-1.5">
        <span className="truncate text-[13.5px] font-extrabold text-ink">{supplier.name}</span>
        <VerifiedBadge show={supplier.verified} small />
      </div>
      <div className="flex items-center gap-2 text-[11.5px] text-sub">
        <Stars value={supplier.trustScore} />
        <span className="inline-flex items-center gap-1">
          <Icon name="pin" size={12} />
          {supplier.city.split(",")[0]}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-sub">
        <Icon name="clock" size={12} /> Responds {supplier.responseTime}
      </div>
    </Link>
  );
}
