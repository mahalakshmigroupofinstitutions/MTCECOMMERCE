import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/Icon";
import { cardHoverClassName } from "@/components/ui";
import { ProductRow } from "@/components/catalog/ProductRow";
import { SupplierCard } from "@/components/catalog/SupplierCard";
import { getCategories, getFeaturedSuppliers, getTopProducts, getCatalogStats } from "@/lib/catalog";

export const revalidate = 0;

export default async function Home() {
  const [categories, suppliers, products, stats] = await Promise.all([
    getCategories(),
    getFeaturedSuppliers(4),
    getTopProducts(4),
    getCatalogStats(),
  ]);

  return (
    <div>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] font-bold tracking-wide">
            <Icon name="shield" size={14} /> 100% GST-verified suppliers across India
          </div>
          <h1 className="mt-5 max-w-xl text-3xl leading-[1.1] font-extrabold tracking-tight md:text-[2.75rem]">
            Source smarter. Get bulk quotes in minutes.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
            Compare verified manufacturers, send one RFQ, and let suppliers compete for your order.
          </p>

          <Link
            href="/search"
            className="mt-7 flex max-w-lg items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sub shadow-lg shadow-black/20 transition-transform duration-150 hover:-translate-y-0.5"
          >
            <Icon name="search" size={19} className="text-ink" />
            <span className="text-sm">Search products or suppliers&hellip;</span>
          </Link>

          <div className="mt-9 flex max-w-lg gap-8">
            {[
              { value: stats.categories, label: "Categories" },
              { value: stats.suppliers, label: "Verified suppliers" },
              { value: stats.products, label: "Products" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-mono text-2xl font-extrabold">{s.value}</div>
                <div className="mt-0.5 text-[12px] text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 md:py-10">
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
              className={`flex items-center gap-3 rounded-2xl border border-line p-3.5 ${cardHoverClassName}`}
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
          className="mb-10 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-ink to-[#232220] p-5 text-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/20"
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
    </div>
  );
}
