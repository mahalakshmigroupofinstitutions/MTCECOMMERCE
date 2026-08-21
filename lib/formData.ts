export function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** A repeated field (checkbox group) or a single comma/newline-separated value
 * (textarea) as a de-duplicated list of trimmed, non-empty strings. */
export function strList(formData: FormData, key: string): string[] {
  const parts = formData
    .getAll(key)
    .flatMap((v) => (typeof v === "string" ? v.split(/[\n,]/) : []))
    .map((v) => v.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

/** An HTML checkbox: present in the payload at all means checked. */
export function bool(formData: FormData, key: string): boolean {
  return formData.get(key) !== null;
}

/** An <input type="file"> the vendor actually picked — an untouched file input
 * still submits an empty File, which must not overwrite a stored upload. */
export function file(formData: FormData, key: string): File | undefined {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

/** Appends ?error=<code> to a path, joining with & if it already has a query string. */
export function withErrorParam(path: string, error: string) {
  return `${path.includes("?") ? path + "&" : path + "?"}error=${error}`;
}
