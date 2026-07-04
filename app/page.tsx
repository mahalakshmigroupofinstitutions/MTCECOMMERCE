import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/Icon";
import { Chip } from "@/components/ui";
import { ProductRow } from "@/components/catalog/ProductRow";
import { SupplierCard } from "@/components/catalog/SupplierCard";
import { getCategories, getFeaturedSuppliers, getTopProducts } from "@/lib/catalog";

export const revalidate = 0;

export default async function Home() {
  const [categories, suppliers, products] = await Promise.all([
    getCategories(),
    getFeaturedSuppliers(4),
    getTopProducts(4),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
      <Link
        href="/search"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-line px-4 py-3.5 text-sub"
      >
        <Icon name="search" size={19} className="text-ink" />
        <span className="text-sm">Search products or suppliers&hellip;</span>
      </Link>

      <div className="mb-8 flex gap-2 overflow-x-auto">
        <Chip>
          <Icon name="shield" size={14} /> 100% Verified
        </Chip>
        <Chip>
          <Icon name="clock" size={14} /> Quotes in min
        </Chip>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-extrabold text-ink">Browse categories</h2>
        <Link href="/search" className="text-sm font-semibold text-sub">
          All
        </Link>
      </div>
      <div className="mb-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/search?category=${c.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-line p-3.5 transition-colors hover:border-ink"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-wash text-ink">
              <Icon name={(c.icon ?? "box") as IconName} size={20} />
            </div>
            <div>
              <div className="text-[13.5px] font-bold text-ink">{c.name}</div>
              <div className="mt-0.5 text-[11px] text-sub">{c.tag}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-extrabold text-ink">Recommended suppliers</h2>
        <Link href="/search" className="text-sm font-semibold text-sub">
          See all
        </Link>
      </div>
      <div className="mb-10 flex gap-3 overflow-x-auto sm:grid sm:grid-cols-4 sm:overflow-visible">
        {suppliers.map((s) => (
          <SupplierCard key={s.id} supplier={s} />
        ))}
      </div>

      <Link
        href="/rfq/new"
        className="mb-10 flex items-center gap-4 rounded-3xl bg-ink p-5 text-white"
      >
        <div className="flex-1">
          <div className="text-[10.5px] font-extrabold tracking-[0.14em] text-white/60 uppercase">
            One request · many quotes
          </div>
          <div className="mt-1.5 text-lg leading-snug font-extrabold">
            Post a requirement,
            <br />
            get bulk quotes free
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[13px] font-extrabold text-ink">
            <Icon name="plus" size={15} strokeWidth={2.4} /> Post RFQ
          </div>
        </div>
      </Link>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-extrabold text-ink">Top-rated products</h2>
        <Link href="/search" className="text-sm font-semibold text-sub">
          See all
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
