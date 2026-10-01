/* Unit tests for the buyer business profile rules (GST Registered + GSTIN,
 * PAN, business profile fields, required fields, optional-field clearing).
 * Run with: npm test
 *
 * Everything here is pure — no database and no server involved. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  effectiveGstRegistered,
  getProfileCompletion,
  type ProfileCompletionInput,
  resolveGst,
  validateBuyerProfile,
  type BuyerProfileFormInput,
} from "@/lib/buyerProfile";
import { isValidPan, normalizePan } from "@/lib/pan";

const VALID_GSTIN = "27AAPFU0939F1ZV";
const NOW = new Date("2026-10-01T00:00:00Z");

/** The minimum a valid Account details submission carries. */
function form(overrides: BuyerProfileFormInput = {}): BuyerProfileFormInput {
  return {
    name: "Asha Rao",
    companyName: "Rao Traders",
    addressLine1: "12 MG Road",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    gstRegistered: "no",
    ...overrides,
  };
}

test("PAN is uppercased and format-checked", () => {
  assert.equal(normalizePan("  abcde1234f "), "ABCDE1234F");
  assert.ok(isValidPan("ABCDE1234F"));
  assert.ok(!isValidPan("ABCD1234F"));
  assert.ok(!isValidPan("ABCDE12345"));
});

test("GST Registered = Yes requires a GSTIN", () => {
  assert.deepEqual(resolveGst({ gstRegistered: "yes", gstNumber: undefined, country: "India" }), {
    ok: false,
    error: "gstinRequired",
  });
});

test("GST Registered = Yes keeps the existing GSTIN checksum rule for India", () => {
  assert.deepEqual(resolveGst({ gstRegistered: "yes", gstNumber: "27AAPFU0939F1ZX", country: "India" }), {
    ok: false,
    error: "invalidGstin",
  });
  assert.deepEqual(resolveGst({ gstRegistered: "yes", gstNumber: VALID_GSTIN.toLowerCase(), country: "India" }), {
    ok: true,
    gstRegistered: true,
    gstNumber: VALID_GSTIN,
  });
});

test("GST Registered = No clears any GSTIN", () => {
  assert.deepEqual(resolveGst({ gstRegistered: "no", gstNumber: VALID_GSTIN, country: "India" }), {
    ok: true,
    gstRegistered: false,
    gstNumber: null,
  });
});

test("a submission without the Yes/No falls back to the old optional-GSTIN behaviour", () => {
  assert.deepEqual(resolveGst({ gstRegistered: undefined, gstNumber: VALID_GSTIN, country: "India" }), {
    ok: true,
    gstRegistered: true,
    gstNumber: VALID_GSTIN,
  });
  assert.deepEqual(resolveGst({ gstRegistered: undefined, gstNumber: undefined, country: "India" }), {
    ok: true,
    gstRegistered: false,
    gstNumber: null,
  });
});

test("legacy buyers with a GSTIN but no flag read as GST registered", () => {
  assert.equal(effectiveGstRegistered(null, VALID_GSTIN), true);
  assert.equal(effectiveGstRegistered(null, null), null);
  assert.equal(effectiveGstRegistered(false, null), false);
});

test("required fields are enforced", () => {
  for (const key of ["name", "companyName", "addressLine1", "country", "state", "city"] as const) {
    const result = validateBuyerProfile(form({ [key]: undefined }), NOW);
    assert.equal(result.ok, false, `${key} should be required`);
  }
});

test("blank optional fields are returned as null so saving clears them", () => {
  const result = validateBuyerProfile(form(), NOW);
  assert.ok(result.ok);
  assert.equal(result.data.addressLine2, null);
  assert.equal(result.data.pincode, null);
  assert.equal(result.data.designation, null);
  assert.equal(result.data.businessEmail, null);
  assert.equal(result.data.panNumber, null);
  assert.equal(result.data.buyerType, null);
  assert.equal(result.data.yearEstablished, null);
  assert.equal(result.data.procurementFrequency, null);
  assert.equal(result.data.gstNumber, null);
});

test("business profile fields are validated and normalized", () => {
  const result = validateBuyerProfile(
    form({
      buyerType: "WHOLESALER",
      yearEstablished: "2010",
      procurementFrequency: "ANNUAL_CONTRACT",
      designation: "Purchase Manager",
      businessEmail: "Purchase@Rao.IN",
      panNumber: "aapfu0939f",
      gstRegistered: "yes",
      gstNumber: VALID_GSTIN,
    }),
    NOW,
  );
  assert.ok(result.ok);
  assert.equal(result.data.buyerType, "WHOLESALER");
  assert.equal(result.data.yearEstablished, 2010);
  assert.equal(result.data.procurementFrequency, "ANNUAL_CONTRACT");
  assert.equal(result.data.businessEmail, "purchase@rao.in");
  assert.equal(result.data.panNumber, "AAPFU0939F");
  assert.equal(result.data.gstRegistered, true);
});

test("invalid business profile values are rejected", () => {
  assert.equal(validateBuyerProfile(form({ buyerType: "DISTRIBUTOR" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ procurementFrequency: "WEEKLY" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ yearEstablished: "1799" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ yearEstablished: "2027" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ yearEstablished: "20x0" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ businessEmail: "not-an-email" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ panNumber: "12345ABCDE" }), NOW).ok, false);
  assert.equal(validateBuyerProfile(form({ designation: "x".repeat(101) }), NOW).ok, false);
});

/** A legacy buyer: registered before the business profile fields existed. */
function legacyBuyer(overrides: Partial<ProfileCompletionInput> = {}): ProfileCompletionInput {
  return {
    name: "Asha Rao",
    companyName: "Rao Traders",
    buyerType: null,
    yearEstablished: null,
    procurementFrequency: null,
    designation: null,
    businessEmail: null,
    panNumber: null,
    gstRegistered: null,
    gstNumber: null,
    addressLine1: null,
    country: null,
    state: null,
    city: null,
    pincode: null,
    ...overrides,
  };
}

test("profile completion handles a legacy buyer with mostly null fields", () => {
  const completion = getProfileCompletion(legacyBuyer());
  assert.equal(completion.totalCount, 14);
  assert.equal(completion.completedCount, 2);
  assert.equal(completion.percent, 14);
  const missing = completion.sections.flatMap((s) => s.items).filter((i) => !i.complete).map((i) => i.label);
  assert.ok(missing.includes("GST details"));
  assert.ok(missing.includes("Buyer type"));
});

test("profile completion treats a legacy GSTIN with no Yes/No as complete GST details", () => {
  const gst = (b: ProfileCompletionInput) =>
    getProfileCompletion(b).sections[0].items.find((i) => i.label === "GST details")!.complete;
  assert.equal(gst(legacyBuyer({ gstNumber: VALID_GSTIN })), true);
  assert.equal(gst(legacyBuyer({ gstRegistered: false })), true);
  assert.equal(gst(legacyBuyer({ gstRegistered: true, gstNumber: null })), false);
});

test("profile completion reaches 100% only when every counted detail is filled", () => {
  const full = legacyBuyer({
    buyerType: "RETAILER",
    yearEstablished: 2010,
    procurementFrequency: "MONTHLY",
    designation: "Owner",
    businessEmail: "asha@rao.in",
    panNumber: "AAPFU0939F",
    gstRegistered: false,
    addressLine1: "12 MG Road",
    country: "India",
    state: "Karnataka",
    city: "Bengaluru",
    pincode: "560001",
  });
  assert.equal(getProfileCompletion(full).percent, 100);
  assert.equal(getProfileCompletion({ ...full, pincode: null }).percent, 93);
});
