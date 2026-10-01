/* Unit tests for the buyer RFQ form's server-side validation.
 * Run with: npm test
 *
 * validateRfqForm is pure — no database and no server involved. Ownership
 * checks (lib/rfq.ts) need a database and aren't exercised here. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLeadingNumber, validateRfqForm, type RfqFormInput } from "@/lib/rfqForm";

const NOW = new Date("2026-10-01T09:00:00Z");

function form(overrides: RfqFormInput = {}): RfqFormInput {
  return { quantity: "500 kg", ...overrides };
}

function errorOf(input: RfqFormInput) {
  const result = validateRfqForm(input, NOW);
  return result.ok ? null : result.error;
}

test("a minimal RFQ with just a quantity is valid", () => {
  const result = validateRfqForm(form(), NOW);
  assert.ok(result.ok);
  assert.equal(result.data.quantity, "500 kg");
  assert.equal(result.data.targetDeliveryDate, undefined);
});

test("quantity must contain a positive number", () => {
  assert.equal(errorOf(form({ quantity: undefined })), "quantity");
  assert.equal(errorOf(form({ quantity: "lots" })), "quantity");
  assert.equal(errorOf(form({ quantity: "0" })), "quantity");
  assert.equal(errorOf(form({ quantity: "1".repeat(51) })), "quantity");
  assert.equal(errorOf(form({ quantity: "1,200 pieces" })), null);
});

test("dropdown values must be one of the form's options", () => {
  assert.equal(errorOf(form({ uom: "barrels" })), "invalidOption");
  assert.equal(errorOf(form({ deliveryTimeline: "90" })), "invalidOption");
  assert.equal(errorOf(form({ deliveryMode: "CIF" })), "invalidOption");
  assert.equal(errorOf(form({ paymentTerms: "credit90" })), "invalidOption");
  assert.equal(
    errorOf(form({ uom: "tons", deliveryTimeline: "15", deliveryMode: "DAP", paymentTerms: "credit30" })),
    null,
  );
});

test("free-text fields are length-capped", () => {
  assert.equal(errorOf(form({ notes: "x".repeat(2001) })), "tooLong");
  assert.equal(errorOf(form({ targetPrice: "x".repeat(101) })), "tooLong");
  assert.equal(errorOf(form({ concession: "x".repeat(101) })), "tooLong");
});

test("dates must be real, not in the past, and the deadline not after delivery", () => {
  assert.equal(errorOf(form({ targetDeliveryDate: "2026-02-30" })), "invalidDate");
  assert.equal(errorOf(form({ submissionDeadline: "next week" })), "invalidDate");
  assert.equal(errorOf(form({ targetDeliveryDate: "2026-09-30" })), "pastDate");
  assert.equal(errorOf(form({ targetDeliveryDate: "2026-10-01" })), null);
  assert.equal(
    errorOf(form({ targetDeliveryDate: "2026-10-10", submissionDeadline: "2026-10-12" })),
    "deadlineAfterDelivery",
  );

  const result = validateRfqForm(form({ targetDeliveryDate: "2026-10-20", submissionDeadline: "2026-10-05" }), NOW);
  assert.ok(result.ok);
  assert.equal(result.data.targetDeliveryDate?.toISOString(), "2026-10-20T00:00:00.000Z");
});

test("parseLeadingNumber keeps its existing behaviour", () => {
  assert.equal(parseLeadingNumber("25 tons"), 25);
  assert.equal(parseLeadingNumber("1,200.5 kg"), 1200.5);
  assert.equal(parseLeadingNumber("none"), null);
});
