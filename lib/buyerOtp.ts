/* Buyer phone OTP — registration and login share this module via
 * BuyerOtpPurpose, even though only registration is wired to a UI so far.
 *
 * Security invariants:
 *   - The raw code is never persisted, logged, or returned to a caller — only
 *     its bcrypt hash is stored, and the code exists in memory just long
 *     enough to hash it and hand it to the delivery layer.
 *   - Only the most recently requested code for a given phone+purpose is ever
 *     valid. Requesting a new one supersedes the last, so a stale code a user
 *     forgot about can't be replayed.
 *   - Every check (expiry, consumed, attempt cap) is re-evaluated at verify
 *     time from persisted state — nothing is trusted from when the code was
 *     issued.
 *
 * Rate limiting is deliberately just two COUNT/timestamp queries against this
 * table — no new infrastructure, no in-memory store (which wouldn't survive
 * multiple server instances anyway). */
import "server-only";
import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendBuyerOtp } from "@/lib/buyerOtpDelivery";
import type { BuyerOtpPurpose } from "@/lib/generated/prisma/client";

const CODE_DIGITS = 6;
const OTP_TTL_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_REQUESTS_PER_WINDOW = 5;
const REQUEST_WINDOW_MINUTES = 15;

const HASH_ROUNDS = 10;

/** Cryptographically random, uniformly distributed 6-digit code (zero-padded).
 * `randomInt` is a CSPRNG (Node's crypto module) — not Math.random(). */
function generateOtpCode(): string {
  const max = 10 ** CODE_DIGITS;
  return randomInt(0, max).toString().padStart(CODE_DIGITS, "0");
}

export type RequestBuyerOtpResult =
  | { ok: true }
  | { ok: false; error: "tooSoon"; retryAfterSeconds: number }
  | { ok: false; error: "rateLimited"; retryAfterSeconds: number };

/** Issues a new OTP for `phone`, after checking the resend cooldown and the
 * rolling request cap. The code is only persisted (as a hash) once delivery
 * succeeds, so a failed send doesn't eat into the caller's request quota. */
export async function requestBuyerOtp(phone: string, purpose: BuyerOtpPurpose): Promise<RequestBuyerOtpResult> {
  const now = new Date();

  const latest = await prisma.buyerOtp.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (latest) {
    const elapsedSeconds = (now.getTime() - latest.createdAt.getTime()) / 1000;
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      return { ok: false, error: "tooSoon", retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds) };
    }
  }

  const windowStart = new Date(now.getTime() - REQUEST_WINDOW_MINUTES * 60_000);
  const recentRequests = await prisma.buyerOtp.findMany({
    where: { phone, purpose, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recentRequests[0].createdAt;
    const retryAfterSeconds = Math.ceil((oldest.getTime() + REQUEST_WINDOW_MINUTES * 60_000 - now.getTime()) / 1000);
    return { ok: false, error: "rateLimited", retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, HASH_ROUNDS);

  // Delivery happens before the row is written: an undeliverable number
  // shouldn't consume the caller's rate-limit budget or leave a hash for a
  // code nobody received.
  await sendBuyerOtp({ phone, code, purpose });

  await prisma.buyerOtp.create({
    data: {
      phone,
      purpose,
      codeHash,
      expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000),
    },
  });

  return { ok: true };
}

export type VerifyBuyerOtpResult =
  | { ok: true }
  | { ok: false; error: "expired" | "invalidCode" | "tooManyAttempts" };

/** Verifies `code` against the most recently requested OTP for phone+purpose.
 * Consumes it (so it can't be replayed) only on a genuine match. */
export async function verifyBuyerOtp(
  phone: string,
  purpose: BuyerOtpPurpose,
  code: string,
): Promise<VerifyBuyerOtpResult> {
  const latest = await prisma.buyerOtp.findFirst({
    where: { phone, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!latest || latest.consumedAt || latest.expiresAt < new Date()) {
    return { ok: false, error: "expired" };
  }
  if (latest.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: "tooManyAttempts" };
  }

  const matches = await bcrypt.compare(code, latest.codeHash);
  if (!matches) {
    await prisma.buyerOtp.update({ where: { id: latest.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: "invalidCode" };
  }

  await prisma.buyerOtp.update({ where: { id: latest.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}

export const BUYER_OTP_RESEND_COOLDOWN_SECONDS = RESEND_COOLDOWN_SECONDS;
