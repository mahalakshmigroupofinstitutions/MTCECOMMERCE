/* Indian GSTIN validation — structure + check digit, not just length===15.
 *
 * A GSTIN is 15 characters: 2-digit state code, 10-character PAN, 1-digit
 * entity code, the literal "Z", and a 1-character checksum computed from the
 * first 14 characters. Reused by both buyer registration and account details
 * so the rule lives in exactly one place. */

const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Valid two-digit GST state/UT codes (01–38 covers every current Indian
 * state and union territory, including Ladakh (38), the most recent
 * addition). 00 and codes above 38 are not currently assigned. */
function hasValidStateCode(gstin: string): boolean {
  const code = Number(gstin.slice(0, 2));
  return code >= 1 && code <= 38;
}

const CHECKSUM_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The standard GSTIN check-digit algorithm (mod-36, factor alternating 2/1
 * from the right) applied to the first 14 characters. */
function computeChecksum(first14: string): string {
  const mod = CHECKSUM_ALPHABET.length;
  let factor = 2;
  let sum = 0;
  for (let i = first14.length - 1; i >= 0; i--) {
    const codePoint = CHECKSUM_ALPHABET.indexOf(first14[i]);
    let digit = factor * codePoint;
    digit = Math.floor(digit / mod) + (digit % mod);
    sum += digit;
    factor = factor === 2 ? 1 : 2;
  }
  const checksumValue = (mod - (sum % mod)) % mod;
  return CHECKSUM_ALPHABET[checksumValue];
}

/** Trims and uppercases input the same way both call sites need before
 * validating or storing a GSTIN. */
export function normalizeGstin(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

/** True only for a structurally valid GSTIN with a matching check digit —
 * not just any 15-character alphanumeric string. Expects already-normalized
 * (trimmed, uppercased) input; callers pass through normalizeGstin() first. */
export function isValidGstin(value: string): boolean {
  if (value.length !== 15) return false;
  if (!GSTIN_SHAPE.test(value)) return false;
  if (!hasValidStateCode(value)) return false;
  return computeChecksum(value.slice(0, 14)) === value[14];
}
