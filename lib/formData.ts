export function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Appends ?error=<code> to a path, joining with & if it already has a query string. */
export function withErrorParam(path: string, error: string) {
  return `${path.includes("?") ? path + "&" : path + "?"}error=${error}`;
}
