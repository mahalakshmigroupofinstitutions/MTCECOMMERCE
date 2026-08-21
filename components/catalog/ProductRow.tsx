import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { CatalogImage, cardHoverClassName } from "@/components/ui";
import type { ProductWithRelations } from "@/lib/catalog";

export function ProductRow({ product }: { product: ProductWithRelations }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group flex items-stretch gap-3 rounded-2xl border border-line p-3 ${cardHoverClassName}`}
    >
      <CatalogImage
        src={product.imageUrl}
        label={product.title}
        height={86}
        sizes="86px"
        className="w-[86px] flex-shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="text-[13.5px] leading-tight font-bold text-ink">{product.title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-sub">
          <span className="font-bold text-ink">{product.supplier.name}</span>
          {product.supplier.verified && <Icon name="verified" size={13} />}
        </div>
        <div className="flex-1" />
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[15px] font-extrabold text-ink">
            ₹{product.price.toLocaleString("en-IN")}
            <span className="text-[11px] font-semibold text-sub">/{product.unit}</span>
          </span>
          <span className="text-[10.5px] text-sub">
            MOQ {product.moq} {product.moqUnit}
          </span>
        </div>
      </div>
    </Link>
  );
}
