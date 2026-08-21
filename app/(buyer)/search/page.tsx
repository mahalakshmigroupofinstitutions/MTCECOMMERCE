import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { chipClassName } from "@/components/ui";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductRow } from "@/components/catalog/ProductRow";
import { getCategories, getDistinctCities, getSearchFacets, searchProducts, type ProductSort } from "@/lib/catalog";
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

  const [categories, cities, facets, { products, total }] = await Promise.all([
    getCategories(),
    getDistinctCities(),
    getSearchFacets(),
    searchProducts({ q: q || undefined, category, verifiedOnly, city, minPrice, maxPrice, sort }),
  ]);

  const filtersActive =
    Boolean(category) || verifiedOnly || Boolean(city) || minPrice !== undefined || maxPrice !== undefined;
  const clearFiltersHref = buildSearchHref(sp, {
    category: undefined,
    verified: undefined,
    city: undefined,
    minPrice: undefined,
    maxPrice: undefined,
  });
  const rowClass = (active: boolean) =>
    `flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors ${
      active ? "bg-ink text-white" : "text-ink hover:bg-wash"
    }`;
  const countClass = (active: boolean) =>
    `font-mono text-[11px] ${active ? "text-white/60" : "text-faint"}`;
  const sectionLabelClass = "mb-1.5 px-1 text-[11px] font-extrabold tracking-wide text-faint uppercase";

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
        <aside className="flex-shrink-0 md:w-60">
          <div className="overflow-hidden rounded-2xl border border-line md:sticky md:top-20">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                <Icon name="filter" size={15} /> Filters
              </span>
              {filtersActive && (
                <Link href={clearFiltersHref} className="text-[11.5px] font-bold text-accent hover:underline">
                  Clear all
                </Link>
              )}
            </div>

            <div className="border-b border-line p-3">
              <span className={`block ${sectionLabelClass}`}>Category</span>
              <div className="flex flex-col gap-0.5">
                {categories.map((c) => {
                  const active = category === c.slug;
                  return (
                    <Link
                      key={c.id}
                      href={buildSearchHref(sp, { category: active ? undefined : c.slug })}
                      className={rowClass(active)}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className={countClass(active)}>{facets.byCategory.get(c.id) ?? 0}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-line p-3">
              <span className={`block ${sectionLabelClass}`}>Trust</span>
              <Link
                href={buildSearchHref(sp, { verified: verifiedOnly ? undefined : "1" })}
                className={rowClass(verifiedOnly)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="verified" size={15} /> Verified only
                </span>
                {verifiedOnly && <Icon name="check" size={15} />}
              </Link>
            </div>

            <div className="border-b border-line p-3">
              <span className={`block ${sectionLabelClass}`}>Location</span>
              <div className="flex flex-col gap-0.5">
                {cities.map((c) => {
                  const active = city === c;
                  return (
                    <Link
                      key={c}
                      href={buildSearchHref(sp, { city: active ? undefined : c })}
                      className={rowClass(active)}
                    >
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <Icon name="pin" size={14} className={active ? "text-white/70" : "text-faint"} />
                        <span className="truncate">{c.split(",")[0]}</span>
                      </span>
                      <span className={countClass(active)}>{facets.byCity.get(c) ?? 0}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <form action="/search" className="p-3">
              <span className={`block ${sectionLabelClass}`}>Price range (₹)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={minPrice ?? ""}
                  placeholder="Min"
                  className="w-full rounded-lg border border-line px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-ink"
                />
                <span className="text-faint">&ndash;</span>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice ?? ""}
                  placeholder="Max"
                  className="w-full rounded-lg border border-line px-2.5 py-2 font-mono text-[12.5px] outline-none focus:border-ink"
                />
              </div>
              {q && <input type="hidden" name="q" value={q} />}
              {category && <input type="hidden" name="category" value={category} />}
              {verifiedOnly && <input type="hidden" name="verified" value="1" />}
              {city && <input type="hidden" name="city" value={city} />}
              <button
                type="submit"
                className="mt-2.5 w-full rounded-lg bg-ink py-2 text-[13px] font-bold text-white transition-colors hover:brightness-125"
              >
                Apply
              </button>
            </form>
          </div>
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
