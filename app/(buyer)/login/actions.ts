"use server";

/* Two-step, OTP-gated buyer login — mirrors app/(buyer)/register/actions.ts's
 * pattern exactly, but for a buyer who already exists: there are no profile
 * fields to carry through, and this step must never create or modify a Buyer
 * row (only registration does that).
 *
 * Step 1 (requestLoginOtpAction) only checks whether the phone belongs to an
 * existing buyer and, if so, sends a code — it never sets the session cookie.
 * The phone is remembered in a short-lived signed cookie of its own
 * (`nx_buyer_pending_login`), the same signing primitive (lib/signedCookie.ts)
 * and pattern the registration flow already uses, completely separate from
 * the real session cookie in lib/session.ts.
 *
 * Step 2 (verifyLoginOtpAction) is the only place the session is created for
 * this flow — and only after lib/buyerOtp.ts confirms the code — via the
 * existing loginExistingBuyer(), unmodified. */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginExistingBuyer } from "@/lib/session";
import { requestBuyerOtp, verifyBuyerOtp } from "@/lib/buyerOtp";
import { normalizePhone } from "@/lib/phone";
import { sign, unsign } from "@/lib/signedCookie";
import { str, withErrorParam as withError } from "@/lib/formData";

const PENDING_COOKIE_NAME = "nx_buyer_pending_login";
const PENDING_MAX_AGE_SECONDS = 15 * 60;

interface PendingLogin {
  phone: string;
  next: string;
}

async function setPendingLogin(pending: PendingLogin) {
  const jar = await cookies();
  jar.set(PENDING_COOKIE_NAME, sign(JSON.stringify(pending)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: PENDING_MAX_AGE_SECONDS,
    path: "/",
  });
}

/** Server-only: reads the pending login cookie. Not exported — the verify
 * page reads it through getPendingLoginPhone() below so it never has to
 * handle the raw signed value itself. */
async function getPendingLogin(): Promise<PendingLogin | null> {
  const jar = await cookies();
  const raw = jar.get(PENDING_COOKIE_NAME)?.value;
  if (!raw) return null;

  const json = unsign(raw);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    if (typeof parsed?.phone !== "string") return null;
    return { next: "/", ...parsed } as PendingLogin;
  } catch {
    return null;
  }
}

/** For the verify page to render a masked phone without exposing the rest of
 * this module's cookie-handling details. */
export async function getPendingLoginPhone(): Promise<string | null> {
  const pending = await getPendingLogin();
  return pending?.phone ?? null;
}

async function clearPendingLogin() {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE_NAME);
}

/** Appends `next` alongside an existing ?error= so a bounce back to /login
 * doesn't drop the deep link the visitor arrived with. */
function withNext(path: string, next: string) {
  return `${path}${path.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`;
}

export async function requestLoginOtpAction(formData: FormData) {
  const phone = normalizePhone(str(formData, "phone"));
  const next = str(formData, "next") ?? "/";

  if (!phone) {
    redirect(withNext(withError("/login", "identify"), next));
  }

  // Existence check only — a read, never a write. An unknown number goes
  // straight to registration instead of silently minting an account here.
  const existing = await prisma.buyer.findUnique({ where: { phone: phone! }, select: { id: true } });
  if (!existing) {
    redirect(`/register?next=${encodeURIComponent(next)}&error=notfound`);
  }

  await setPendingLogin({ phone: phone!, next });

  // CAPTCHA integration point: verify a Turnstile token from formData here,
  // before spending an OTP send, once the project has a configured site key.
  // Until then this endpoint relies solely on the rate limits below.

  const result = await requestBuyerOtp(phone!, "LOGIN");
  if (!result.ok) {
    redirect(withNext(withError("/login", result.error), next));
  }

  redirect("/login/verify");
}

export async function resendLoginOtpAction() {
  const pending = await getPendingLogin();
  if (!pending) redirect(withError("/login", "sessionExpired"));

  const result = await requestBuyerOtp(pending!.phone, "LOGIN");
  if (!result.ok) {
    redirect(withError("/login/verify", result.error));
  }

  redirect("/login/verify?sent=1");
}

export async function verifyLoginOtpAction(formData: FormData) {
  const pending = await getPendingLogin();
  if (!pending) redirect(withError("/login", "sessionExpired"));

  const code = str(formData, "code");
  if (!code || !/^\d{6}$/.test(code)) {
    redirect(withError("/login/verify", "invalidCode"));
  }

  const result = await verifyBuyerOtp(pending!.phone, "LOGIN", code!);
  if (!result.ok) {
    redirect(withError("/login/verify", result.error));
  }

  // The existing session function — unmodified. Re-looks up the buyer rather
  // than trusting the pending cookie's snapshot, and only sets the session
  // cookie if that buyer still exists.
  const buyer = await loginExistingBuyer(pending!.phone);
  if (!buyer) redirect(withError("/login", "notfound"));

  const next = pending!.next;
  await clearPendingLogin();

  redirect(next);
}

export async function changePendingLoginAction() {
  await clearPendingLogin();
  redirect("/login");
}
