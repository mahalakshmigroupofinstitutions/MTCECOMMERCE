/* Shared rules for the buyer business profile — dropdown options, GST
 * registration handling and server-side validation of the Account details
 * form — so registration, the account action and the account UI all agree.
 * Pure functions only (no prisma, no server-only), so client components can
 * import the option lists and labels too. */
import { isValidGstin, normalizeGstin } from "@/lib/gstin";
import { isValidPan, normalizePan } from "@/lib/pan";
import { exceedsLength, isEmail } from "@/lib/validate";

/** Mirrors the BuyerType enum in prisma/schema.prisma. */
export type BuyerTypeValue = "RETAILER" | "WHOLESALER" | "CORPORATE" | "END_CONSUMER";
/** Mirrors the ProcurementFrequency enum in prisma/schema.prisma. */
export type ProcurementFrequencyValue = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "ANNUAL_CONTRACT";

export const BUYER_TYPE_OPTIONS: { value: BuyerTypeValue; label: string }[] = [
  { value: "RETAILER", label: "Retailer" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "END_CONSUMER", label: "End Consumer" },
];

export const PROCUREMENT_FREQUENCY_OPTIONS: { value: ProcurementFrequencyValue; label: string }[] = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUAL_CONTRACT", label: "Annual contract" },
];

export function buyerTypeLabel(value: string | null | undefined): string | null {
  return BUYER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function procurementFrequencyLabel(value: string | null | undefined): string | null {
  return PROCUREMENT_FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export const MIN_YEAR_ESTABLISHED = 1800;

const MAX_DESIGNATION_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

/** Buyer rows created before `gstRegistered` existed have it null — treat a
 * stored GSTIN as "registered" so they keep displaying/editing as before.
 * Returns null only when there's genuinely nothing to go on. */
export function effectiveGstRegistered(gstRegistered: boolean | null, gstNumber: string | null): boolean | null {
  if (gstRegistered !== null) return gstRegistered;
  return gstNumber ? true : null;
}

export type GstErrorCode = "gstinRequired" | "invalidGstin";

export const GST_ERROR_MESSAGES: Record<GstErrorCode, string> = {
  gstinRequired: "You selected GST registered — please enter your GSTIN.",
  invalidGstin: "That GSTIN doesn't look valid — double-check it.",
};

export type ResolvedGst =
  | { ok: true; gstRegistered: boolean; gstNumber: string | null }
  | { ok: false; error: GstErrorCode };

/** GST Registered Yes/No → what to store. "yes" requires a GSTIN, checked
 * with the existing format/checksum rule exactly where it applied before
 * (country India); "no" always clears any GSTIN. A submission with no
 * Yes/No at all (an older cached form) falls back to the previous behaviour:
 * an optional GSTIN, registered iff one was given. */
export function resolveGst(input: {
  gstRegistered: string | undefined;
  gstNumber: string | undefined;
  country: string | undefined;
}): ResolvedGst {
  const gstNumber = input.gstNumber ? normalizeGstin(input.gstNumber) : "";
  const registered = input.gstRegistered === "yes" ? true : input.gstRegistered === "no" ? false : !!gstNumber;

  if (!registered) return { ok: true, gstRegistered: false, gstNumber: null };
  if (!gstNumber) return { ok: false, error: "gstinRequired" };
  if (input.country === "India" && !isValidGstin(gstNumber)) return { ok: false, error: "invalidGstin" };
  return { ok: true, gstRegistered: true, gstNumber };
}

/** Raw (already-trimmed, empty → undefined) values from the Account details form. */
export interface BuyerProfileFormInput {
  name?: string;
  companyName?: string;
  buyerType?: string;
  yearEstablished?: string;
  procurementFrequency?: string;
  designation?: string;
  businessEmail?: string;
  panNumber?: string;
  gstRegistered?: string;
  gstNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

/** Every editable column, with optional ones as explicit `null` when blank —
 * so saving an emptied field actually clears it instead of being skipped. */
export interface BuyerProfileData {
  name: string;
  companyName: string;
  buyerType: BuyerTypeValue | null;
  yearEstablished: number | null;
  procurementFrequency: ProcurementFrequencyValue | null;
  designation: string | null;
  businessEmail: string | null;
  panNumber: string | null;
  gstRegistered: boolean;
  gstNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  country: string;
  state: string;
  city: string;
  pincode: string | null;
}

export type BuyerProfileValidation = { ok: true; data: BuyerProfileData } | { ok: false; error: string };

export function validateBuyerProfile(input: BuyerProfileFormInput, now = new Date()): BuyerProfileValidation {
  const { name, companyName, addressLine1, country, state, city } = input;
  // Same required set registration enforces (register/actions.ts).
  if (!name || !companyName || !addressLine1 || !country || !state || !city) {
    return {
      ok: false,
      error: "Please fill in the contact person, company name, address line 1, country, state and city.",
    };
  }

  let buyerType: BuyerTypeValue | null = null;
  if (input.buyerType) {
    const match = BUYER_TYPE_OPTIONS.find((o) => o.value === input.buyerType);
    if (!match) return { ok: false, error: "Please choose a valid buyer type." };
    buyerType = match.value;
  }

  let procurementFrequency: ProcurementFrequencyValue | null = null;
  if (input.procurementFrequency) {
    const match = PROCUREMENT_FREQUENCY_OPTIONS.find((o) => o.value === input.procurementFrequency);
    if (!match) return { ok: false, error: "Please choose a valid procurement frequency." };
    procurementFrequency = match.value;
  }

  let yearEstablished: number | null = null;
  if (input.yearEstablished) {
    const year = Number(input.yearEstablished);
    if (!/^\d{4}$/.test(input.yearEstablished) || year < MIN_YEAR_ESTABLISHED || year > now.getFullYear()) {
      return {
        ok: false,
        error: `Year established should be a year between ${MIN_YEAR_ESTABLISHED} and ${now.getFullYear()}.`,
      };
    }
    yearEstablished = year;
  }

  const designation = input.designation ?? null;
  if (exceedsLength(designation, MAX_DESIGNATION_LENGTH)) {
    return { ok: false, error: `Designation should be at most ${MAX_DESIGNATION_LENGTH} characters.` };
  }

  const businessEmail = input.businessEmail ? input.businessEmail.toLowerCase() : null;
  if (businessEmail && (!isEmail(businessEmail) || exceedsLength(businessEmail, MAX_EMAIL_LENGTH))) {
    return { ok: false, error: "That business email doesn't look right." };
  }

  const panNumber = input.panNumber ? normalizePan(input.panNumber) : null;
  if (panNumber && !isValidPan(panNumber)) {
    return { ok: false, error: "That PAN doesn't look valid — it should be like ABCDE1234F." };
  }

  const gst = resolveGst({ gstRegistered: input.gstRegistered, gstNumber: input.gstNumber, country });
  if (!gst.ok) return { ok: false, error: GST_ERROR_MESSAGES[gst.error] };

  return {
    ok: true,
    data: {
      name,
      companyName,
      buyerType,
      yearEstablished,
      procurementFrequency,
      designation,
      businessEmail,
      panNumber,
      gstRegistered: gst.gstRegistered,
      gstNumber: gst.gstNumber,
      addressLine1,
      addressLine2: input.addressLine2 ?? null,
      country,
      state,
      city,
      pincode: input.pincode ?? null,
    },
  };
}

/** The saved buyer columns the completion indicator looks at — every one
 * nullable, since legacy rows predate most of them. */
export interface ProfileCompletionInput {
  name: string | null;
  companyName: string | null;
  buyerType: string | null;
  yearEstablished: number | null;
  procurementFrequency: string | null;
  designation: string | null;
  businessEmail: string | null;
  panNumber: string | null;
  gstRegistered: boolean | null;
  gstNumber: string | null;
  addressLine1: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
}

export interface ProfileCompletionItem {
  label: string;
  complete: boolean;
}

export interface ProfileCompletionSection {
  title: string;
  items: ProfileCompletionItem[];
}

export interface ProfileCompletion {
  percent: number;
  completedCount: number;
  totalCount: number;
  sections: ProfileCompletionSection[];
}

/** Informational only — never required anywhere. Counts every editable
 * profile detail equally, grouped the same way the Account details sections
 * are. Phone is left out (always present and OTP-verified) as is address
 * line 2 (genuinely optional). "GST details" is complete once the buyer has
 * answered: No, or Yes with a GSTIN — legacy rows resolved through
 * effectiveGstRegistered(). */
export function getProfileCompletion(buyer: ProfileCompletionInput): ProfileCompletion {
  const gstRegistered = effectiveGstRegistered(buyer.gstRegistered, buyer.gstNumber);
  const filled = (value: string | number | null) => value !== null && value !== "";

  const sections: ProfileCompletionSection[] = [
    {
      title: "Business Profile",
      items: [
        { label: "Company name", complete: filled(buyer.companyName) },
        { label: "Buyer type", complete: filled(buyer.buyerType) },
        { label: "Year established", complete: filled(buyer.yearEstablished) },
        { label: "Procurement frequency", complete: filled(buyer.procurementFrequency) },
        { label: "GST details", complete: gstRegistered === false || (gstRegistered === true && filled(buyer.gstNumber)) },
        { label: "PAN", complete: filled(buyer.panNumber) },
      ],
    },
    {
      title: "Primary Contact",
      items: [
        { label: "Contact person", complete: filled(buyer.name) },
        { label: "Designation", complete: filled(buyer.designation) },
        { label: "Business email", complete: filled(buyer.businessEmail) },
      ],
    },
    {
      title: "Business Address",
      items: [
        { label: "Address line 1", complete: filled(buyer.addressLine1) },
        { label: "Country", complete: filled(buyer.country) },
        { label: "State", complete: filled(buyer.state) },
        { label: "City", complete: filled(buyer.city) },
        { label: "Pincode", complete: filled(buyer.pincode) },
      ],
    },
  ];

  const items = sections.flatMap((s) => s.items);
  const completedCount = items.filter((i) => i.complete).length;
  return {
    percent: Math.round((completedCount / items.length) * 100),
    completedCount,
    totalCount: items.length,
    sections,
  };
}
