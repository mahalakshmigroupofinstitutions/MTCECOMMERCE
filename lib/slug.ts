export function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

/** Appends a short random suffix so slugs stay unique even when titles collide
 * (e.g. two vendors both listing "Cotton Fabric"). */
export function uniqueSlug(base: string) {
  return `${slugify(base)}-${Math.random().toString(36).slice(2, 7)}`;
}
