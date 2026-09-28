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

/** Joins a separately-selected dial code and local number into the single
 * raw string normalizePhone() already expects — normalizePhone() itself is
 * untouched, so every existing caller (OTP request/verify, session) keeps
 * working exactly as before. Also guards against the user pasting a number
 * that already includes the dial code (or, for India, a leading trunk "0"),
 * so the code isn't accidentally doubled. */
export function composePhoneInput(dialCode: string, localNumber: string): string {
  const dialDigits = dialCode.replace(/\D/g, "");
  let digits = localNumber.replace(/\D/g, "");
  if (dialDigits && digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
    digits = digits.slice(dialDigits.length);
  } else if (dialCode === "+91" && digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return `+${dialDigits}${digits}`;
}

/** Loose per-country plausibility check on the *local* number, run before
 * composePhoneInput()/normalizePhone() so a malformed number is rejected
 * with a clear error instead of silently normalizing into something wrong.
 * India gets the real numbering-plan rule (10 digits, starting 6-9); every
 * other country only gets a generic ITU E.164 length check (4-14 digits) —
 * this project doesn't carry a full per-country numbering-plan dataset, and
 * the smallest-reliable-implementation guidance doesn't justify adding one
 * here for a UX-only pre-check (the OTP step remains the real proof of
 * ownership either way). */
export function isPlausiblePhoneNumber(dialCode: string, localNumber: string): boolean {
  const digits = localNumber.replace(/\D/g, "");
  if (!digits) return false;
  if (dialCode === "+91") return /^[6-9]\d{9}$/.test(digits);
  return digits.length >= 4 && digits.length <= 14;
}
