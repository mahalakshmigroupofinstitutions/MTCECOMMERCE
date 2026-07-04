import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { Placeholder } from "@/components/ui";
import type { ProductWithRelations } from "@/lib/catalog";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  return (
    <Link href={`/product/${product.slug}`} className="flex flex-col gap-2 rounded-2xl border border-line p-2.5">
      <Placeholder label={product.title} height={110} />
      <div className="text-[12.5px] leading-tight font-bold text-ink">{product.title}</div>
      <div className="font-mono text-sm font-extrabold text-ink">
        ₹{product.price.toLocaleString("en-IN")}
        <span className="text-[10px] font-semibold text-sub">/{product.unit}</span>
      </div>
      <div className="flex items-center gap-1 text-[10.5px] text-sub">
        {product.supplier.verified && <Icon name="verified" size={12} />}
        <span className="truncate">{product.supplier.name}</span>
      </div>
    </Link>
  );
}
