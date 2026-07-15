import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { chipClassName } from "@/components/ui";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRow } from "@/components/catalog/ProductRow";
import { getCategories, getDistinctCities, searchProducts, type ProductSort } from "@/lib/catalog";
import { buildSearchHref, type SearchParamsRecord } from "@/lib/searchParams";

export const revalidate = 0;

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "best", label: "Best match" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const verifiedOnly = sp.verified === "1";
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const minPrice = typeof sp.minPrice === "string" && sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" && sp.maxPrice ? Number(sp.maxPrice) : undefined;
  const sort = (typeof sp.sort === "string" ? sp.sort : "best") as ProductSort;
  const view = sp.view === "list" ? "list" : "grid";

  const [categories, cities, { products, total }] = await Promise.all([
    getCategories(),
    getDistinctCities(),
    searchProducts({ q: q || undefined, category, verifiedOnly, city, minPrice, maxPrice, sort }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <form action="/search" className="mb-4 flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
        <Icon name="search" size={19} className="text-ink" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products or suppliers&hellip;"
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-sub"
        />
        {category && <input type="hidden" name="category" value={category} />}
        {verifiedOnly && <input type="hidden" name="verified" value="1" />}
        {city && <input type="hidden" name="city" value={city} />}
        {sort !== "best" && <input type="hidden" name="sort" value={sort} />}
        {view !== "grid" && <input type="hidden" name="view" value={view} />}
        <button type="submit" className="text-sm font-bold text-ink">
          Search
        </button>
      </form>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="flex flex-shrink-0 flex-col gap-5 md:w-56">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-extrabold text-ink">Category</span>
              {category && (
                <Link href={buildSearchHref(sp, { category: undefined })} className="text-[11.5px] font-bold text-sub">
                  Clear
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={buildSearchHref(sp, { category: category === c.slug ? undefined : c.slug })}
                  className={chipClassName({ active: category === c.slug })}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-extrabold text-ink">Trust</span>
            <Link
              href={buildSearchHref(sp, { verified: verifiedOnly ? undefined : "1" })}
              className={chipClassName({ active: verifiedOnly })}
            >
              <Icon name="verified" size={14} /> Verified only
            </Link>
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-extrabold text-ink">Location</span>
            <div className="flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <Link
                  key={c}
                  href={buildSearchHref(sp, { city: city === c ? undefined : c })}
                  className={chipClassName({ active: city === c })}
                >
                  {c.split(",")[0]}
                </Link>
              ))}
            </div>
          </div>

          <form action="/search" className="flex flex-col gap-2">
            <span className="text-[13px] font-extrabold text-ink">Price range</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                defaultValue={minPrice ?? ""}
                placeholder="Min"
                className="w-full rounded-lg border border-line px-2.5 py-2 font-mono text-[12.5px]"
              />
              <input
                type="number"
                name="maxPrice"
                defaultValue={maxPrice ?? ""}
                placeholder="Max"
                className="w-full rounded-lg border border-line px-2.5 py-2 font-mono text-[12.5px]"
              />
            </div>
            {q && <input type="hidden" name="q" value={q} />}
            {category && <input type="hidden" name="category" value={category} />}
            {verifiedOnly && <input type="hidden" name="verified" value="1" />}
            {city && <input type="hidden" name="city" value={city} />}
            <button type="submit" className={chipClassName()}>
              Apply
            </button>
          </form>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-ink">{q || "All products"}</h1>
              <div className="mt-1 text-[13px] text-sub">
                <b className="text-ink">{total}</b> {total === 1 ? "product" : "products"}
              </div>
            </div>
            <div className="flex gap-1 rounded-lg border border-line p-0.5">
              {(["grid", "list"] as const).map((v) => (
                <Link
                  key={v}
                  href={buildSearchHref(sp, { view: v === "grid" ? undefined : v })}
                  className={`flex rounded-md p-1.5 ${view === v ? "bg-ink text-white" : "text-sub"}`}
                >
                  <Icon name={v} size={16} />
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto">
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={buildSearchHref(sp, { sort: s.value === "best" ? undefined : s.value })}
                className={chipClassName({ active: sort === s.value })}
              >
                {s.label}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-line p-10 text-center text-sm text-sub">
              No products match these filters.
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {products.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
