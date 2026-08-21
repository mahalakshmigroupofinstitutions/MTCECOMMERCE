/* Shared phone normalization for buyer/vendor identity capture.
 * A bare 10-digit input is treated as a local Indian number (prefixed +91);
 * anything else is assumed to already carry a country code. Returns null when
 * there aren't enough digits to be a plausible phone number. */
export function normalizePhone(raw: string | undefined | null): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}
