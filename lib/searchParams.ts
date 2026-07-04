export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Builds a `/search` href that keeps the current filters and overrides only the given keys. */
export function buildSearchHref(current: SearchParamsRecord, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (typeof value === "string") params.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
