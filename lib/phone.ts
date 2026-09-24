/* Shared phone normalization for buyer/vendor identity capture.
 * A bare 10-digit input is treated as a local Indian number (prefixed +91);
 * anything else is assumed to already carry a country code. Returns null when
 * there aren't enough digits to be a plausible phone number. */
export function normalizePhone(raw: string | undefined | null): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

/** A normalizePhone() result, for on-screen display only — keeps the leading
 * "+" and last two digits, masks everything in between. Never used for lookups
 * or comparisons, and never sent anywhere except rendered on the page. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/^\+/, "");
  if (digits.length <= 2) return `+${"•".repeat(digits.length)}`;
  return `+${"•".repeat(digits.length - 2)}${digits.slice(-2)}`;
}
