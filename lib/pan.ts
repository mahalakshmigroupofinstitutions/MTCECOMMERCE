/* Indian PAN validation — the 10-character structure (5 letters, 4 digits,
 * 1 letter). PAN has no public check digit, so this is a format check only.
 * Safe to import from both client components and server actions, same as
 * lib/gstin.ts. */

const PAN_SHAPE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** Trims and uppercases input before validating or storing a PAN. */
export function normalizePan(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

/** Expects already-normalized input; callers pass through normalizePan() first. */
export function isValidPan(value: string): boolean {
  return PAN_SHAPE.test(value);
}
