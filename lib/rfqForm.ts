/* Server-side validation for the buyer's RFQ form (app/(buyer)/rfq/new).
 * Pure — no prisma, no server-only — so the option lists can be shared with
 * the form page and the rules unit-tested. Product/category existence is
 * checked separately against the database (resolveRfqTarget in lib/rfq.ts).
 *
 * The browser's `required`/<select> constraints are conveniences only: a
 * Server Action is a public POST endpoint, so every value is re-checked here. */
import { exceedsLength } from "@/lib/validate";

/** Best-effort: pulls the leading number out of a free-text quantity like "25 tons".
 * Lives here (pure) rather than in lib/rfq.ts so validation can use it without
 * importing prisma; lib/rfq.ts re-exports it for existing callers. */
export function parseLeadingNumber(text: string): number | null {
  const match = text.match(/[\d,]+(\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export const RFQ_UOM_OPTIONS = [
  { value: "pieces", label: "Pieces / Units" },
  { value: "kg", label: "Kilograms" },
  { value: "tons", label: "Tons" },
  { value: "liters", label: "Liters" },
  { value: "boxes", label: "Boxes" },
] as const;

export const RFQ_DELIVERY_TIMELINE_OPTIONS = [
  { value: "7", label: "Within 7 Days" },
  { value: "15", label: "Within 15 Days" },
  { value: "30", label: "Within 30 Days" },
] as const;

export const RFQ_DELIVERY_MODE_OPTIONS = [
  { value: "DAP", label: "Door Delivery (DAP)" },
  { value: "EXW", label: "Ex-Works Pickup" },
] as const;

export const RFQ_PAYMENT_TERMS_OPTIONS = [
  { value: "credit30", label: "30 Days Credit" },
  { value: "full_on_delivery", label: "100% on Delivery" },
  { value: "advance_balance", label: "Advance + Balance" },
] as const;

const MAX_QUANTITY_LENGTH = 50;
const MAX_SHORT_TEXT_LENGTH = 100;
const MAX_NOTES_LENGTH = 2000;

export type RfqFormErrorCode = "quantity" | "invalidOption" | "invalidDate" | "pastDate" | "deadlineAfterDelivery" | "tooLong";

export const RFQ_FORM_ERROR_MESSAGES: Record<RfqFormErrorCode, string> = {
  quantity: "Please enter a quantity greater than zero, e.g. 500.",
  invalidOption: "One of the selected options isn't valid — please choose again.",
  invalidDate: "One of the dates isn't valid — please pick it again.",
  pastDate: "Dates can't be in the past.",
  deadlineAfterDelivery: "The submission deadline should be on or before the target delivery date.",
  tooLong: "One of the fields is too long — please shorten it.",
};

/** Raw (already-trimmed, empty → undefined) values from the RFQ form. */
export interface RfqFormInput {
  quantity?: string;
  uom?: string;
  notes?: string;
  targetPrice?: string;
  concession?: string;
  deliveryTimeline?: string;
  deliveryMode?: string;
  paymentTerms?: string;
  targetDeliveryDate?: string;
  submissionDeadline?: string;
}

export interface RfqFormData {
  quantity: string;
  uom?: string;
  notes?: string;
  targetPrice?: string;
  concession?: string;
  deliveryTimeline?: string;
  deliveryMode?: string;
  paymentTerms?: string;
  targetDeliveryDate?: Date;
  submissionDeadline?: Date;
}

export type RfqFormValidation = { ok: true; data: RfqFormData } | { ok: false; error: RfqFormErrorCode };

function isOneOf(value: string | undefined, options: readonly { value: string }[]): boolean {
  return value === undefined || options.some((o) => o.value === value);
}

/** "YYYY-MM-DD" (what <input type="date"> submits) → that calendar date, or
 * null if it isn't a real date (e.g. 2026-02-30). */
function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function validateRfqForm(input: RfqFormInput, now = new Date()): RfqFormValidation {
  const { quantity } = input;
  if (!quantity || exceedsLength(quantity, MAX_QUANTITY_LENGTH)) return { ok: false, error: "quantity" };
  const qty = parseLeadingNumber(quantity);
  if (qty === null || qty <= 0) return { ok: false, error: "quantity" };

  if (
    !isOneOf(input.uom, RFQ_UOM_OPTIONS) ||
    !isOneOf(input.deliveryTimeline, RFQ_DELIVERY_TIMELINE_OPTIONS) ||
    !isOneOf(input.deliveryMode, RFQ_DELIVERY_MODE_OPTIONS) ||
    !isOneOf(input.paymentTerms, RFQ_PAYMENT_TERMS_OPTIONS)
  ) {
    return { ok: false, error: "invalidOption" };
  }

  if (
    exceedsLength(input.notes, MAX_NOTES_LENGTH) ||
    exceedsLength(input.targetPrice, MAX_SHORT_TEXT_LENGTH) ||
    exceedsLength(input.concession, MAX_SHORT_TEXT_LENGTH)
  ) {
    return { ok: false, error: "tooLong" };
  }

  const targetDeliveryDate = input.targetDeliveryDate ? parseDateOnly(input.targetDeliveryDate) : undefined;
  const submissionDeadline = input.submissionDeadline ? parseDateOnly(input.submissionDeadline) : undefined;
  if (targetDeliveryDate === null || submissionDeadline === null) return { ok: false, error: "invalidDate" };

  // Compared as calendar dates; "today" is allowed.
  const today = now.toISOString().slice(0, 10);
  if ((input.targetDeliveryDate && input.targetDeliveryDate < today) || (input.submissionDeadline && input.submissionDeadline < today)) {
    return { ok: false, error: "pastDate" };
  }
  if (input.targetDeliveryDate && input.submissionDeadline && input.submissionDeadline > input.targetDeliveryDate) {
    return { ok: false, error: "deadlineAfterDelivery" };
  }

  return {
    ok: true,
    data: {
      quantity,
      uom: input.uom,
      notes: input.notes,
      targetPrice: input.targetPrice,
      concession: input.concession,
      deliveryTimeline: input.deliveryTimeline,
      deliveryMode: input.deliveryMode,
      paymentTerms: input.paymentTerms,
      targetDeliveryDate,
      submissionDeadline,
    },
  };
}
