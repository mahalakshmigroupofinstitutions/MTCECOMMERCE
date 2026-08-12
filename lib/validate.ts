/* Shared server-side field validation. Browser-side `type="email"` / `required`
 * are conveniences only — every mutation re-checks the value here, because a
 * Server Action is a public POST endpoint that never has to go through a form. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function isEmail(value: string | null | undefined): boolean {
  return typeof value === "string" && EMAIL_PATTERN.test(value);
}

/** Indian 6-digit PIN, which never starts with 0. */
export function isPincode(value: string | null | undefined): boolean {
  return typeof value === "string" && PINCODE_PATTERN.test(value);
}

export function isHexColor(value: string | null | undefined): boolean {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}

/** 24-hour "HH:MM", the shape an <input type="time"> submits. */
export function isTimeOfDay(value: string | null | undefined): boolean {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

/** Normalizes a vendor-typed website/social link to an absolute http(s) URL, or
 * null when it can't be one. A bare host ("acme.co.in") gets https:// prepended
 * so vendors aren't forced to type a scheme; anything with another protocol
 * (javascript:, data:) is rejected rather than fixed up. */
export function normalizeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null;
  return url.toString();
}

/** Guards free-text columns against a client posting megabytes of prose. */
export function exceedsLength(value: string | null | undefined, max: number): boolean {
  return typeof value === "string" && value.length > max;
}
