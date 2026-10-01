"use server";

/* Two-step, OTP-gated buyer registration.
 *
 * Step 1 (requestRegisterOtpAction) never creates a Buyer and never sets the
 * session cookie — it only sends a code and remembers what the visitor typed,
 * in a short-lived signed cookie of its own (`nx_buyer_pending_reg`), completely
 * separate from the real session cookie in lib/session.ts. The pending cookie
 * carries the phone number itself, so nothing needs to round-trip through the
 * verify form (or a query string) except the 6-digit code the user types.
 *
 * Step 2 (verifyRegisterOtpAction) is the only place a Buyer row or session is
 * created for this flow — and only after lib/buyerOtp.ts confirms the code. */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { completeBuyerRegistration } from "@/lib/session";
import { requestBuyerOtp, verifyBuyerOtp } from "@/lib/buyerOtp";
import { composePhoneInput, isPlausiblePhoneNumber, normalizePhone } from "@/lib/phone";
import { resolveGst } from "@/lib/buyerProfile";
import { sign, unsign } from "@/lib/signedCookie";
import { str, withErrorParam as withError } from "@/lib/formData";

const PENDING_COOKIE_NAME = "nx_buyer_pending_reg";
const PENDING_MAX_AGE_SECONDS = 15 * 60;

interface PendingRegistration {
  phone: string;
  phoneCountryCode?: string;
  name: string;
  companyName?: string;
  gstNumber?: string;
  /** Absent on a pending cookie issued before GST Registered existed. */
  gstRegistered?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  city?: string;
  state?: string;
  pincode?: string;
  /** Where to land after verification — preserves the existing ?next= deep
   * link (e.g. "log in to save this supplier") that the /login page already
   * passes through to /register today. */
  next: string;
}

async function setPendingRegistration(pending: PendingRegistration) {
  const jar = await cookies();
  jar.set(PENDING_COOKIE_NAME, sign(JSON.stringify(pending)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: PENDING_MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Server-only: reads the pending registration cookie. Not exported — the
 * verify page reads it through getPendingRegistrationPhone() below so it never
 * has to handle the raw signed value itself. */
async function getPendingRegistration(): Promise<PendingRegistration | null> {
  const jar = await cookies();
  const raw = jar.get(PENDING_COOKIE_NAME)?.value;
  if (!raw) return null;

  const json = unsign(raw);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    if (typeof parsed?.phone !== "string" || typeof parsed?.name !== "string") return null;
    return { next: "/", ...parsed } as PendingRegistration;
  } catch {
    return null;
  }
}

/** For the verify page to render a masked phone without exposing the rest of
 * this module's cookie-handling details. */
export async function getPendingRegistrationPhone(): Promise<string | null> {
  const pending = await getPendingRegistration();
  return pending?.phone ?? null;
}

async function clearPendingRegistration() {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE_NAME);
}

/** Appends `next` alongside an existing ?error= so a bounce back to /register
 * doesn't drop the deep link the visitor arrived with. */
function withNext(path: string, next: string) {
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`;
}

export async function requestRegisterOtpAction(formData: FormData) {
  const name = str(formData, "name");
  const companyName = str(formData, "companyName");
  const phoneCountryCode = str(formData, "phoneCountryCode") ?? "+91";
  const phoneLocal = str(formData, "phone");
  const addressLine1 = str(formData, "addressLine1");
  const country = str(formData, "country");
  const city = str(formData, "city");
  const state = str(formData, "state");
  const pincode = str(formData, "pincode");
  const next = str(formData, "next") ?? "/";

  // Server-side is the real gate — the form's `required` attributes are only a
  // convenience. addressLine2/gstNumber are deliberately excluded: the two
  // optional fields.
  if (!name || !companyName || !phoneLocal || !addressLine1 || !country || !city || !state) {
    redirect(withNext(withError("/register", "identify"), next));
  }

  if (!isPlausiblePhoneNumber(phoneCountryCode, phoneLocal!)) {
    redirect(withNext(withError("/register", "invalidPhone"), next));
  }
  const phone = normalizePhone(composePhoneInput(phoneCountryCode, phoneLocal!));
  if (!phone) {
    redirect(withNext(withError("/register", "invalidPhone"), next));
  }

  // GST Registered = Yes requires a GSTIN (existing format/checksum rule for
  // India); No discards any GSTIN. Same rule the account page applies.
  const gst = resolveGst({
    gstRegistered: str(formData, "gstRegistered"),
    gstNumber: str(formData, "gstNumber"),
    country,
  });
  if (!gst.ok) {
    redirect(withNext(withError("/register", gst.error), next));
  }
  const { gstRegistered, gstNumber } = gst;

  await setPendingRegistration({
    phone: phone!,
    phoneCountryCode,
    name: name!,
    companyName,
    gstNumber: gstNumber ?? undefined,
    gstRegistered,
    addressLine1,
    addressLine2: str(formData, "addressLine2"),
    country,
    city,
    state,
    pincode,
    next,
  });

  // CAPTCHA integration point: verify a Turnstile token from formData here,
  // before spending an OTP send, once the project has a configured site key.
  // Until then this endpoint relies solely on the rate limits below.

  const result = await requestBuyerOtp(phone!, "REGISTER");
  if (!result.ok) {
    redirect(withNext(withError("/register", result.error), next));
  }

  redirect("/register/verify");
}

export async function resendRegisterOtpAction() {
  const pending = await getPendingRegistration();
  if (!pending) redirect(withError("/register", "sessionExpired"));

  const result = await requestBuyerOtp(pending!.phone, "REGISTER");
  if (!result.ok) {
    redirect(withError("/register/verify", result.error));
  }

  redirect("/register/verify?sent=1");
}

export async function verifyRegisterOtpAction(formData: FormData) {
  const pending = await getPendingRegistration();
  if (!pending) redirect(withError("/register", "sessionExpired"));

  const code = str(formData, "code");
  if (!code || !/^\d{6}$/.test(code)) {
    redirect(withError("/register/verify", "invalidCode"));
  }

  const result = await verifyBuyerOtp(pending!.phone, "REGISTER", code!);
  if (!result.ok) {
    redirect(withError("/register/verify", result.error));
  }

  await completeBuyerRegistration(pending!);
  const next = pending!.next;
  await clearPendingRegistration();

  // A brief "Welcome, {name}" transition, then on to `next` (defaults to the
  // homepage) — never straight to /dashboard, which is reached only by
  // deliberate navigation from here on.
  redirect(`/register/welcome?next=${encodeURIComponent(next)}`);
}

export async function changePendingRegistrationAction() {
  await clearPendingRegistration();
  redirect("/register");
}
