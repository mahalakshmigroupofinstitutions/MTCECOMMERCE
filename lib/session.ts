/* Stopgap buyer identity for Phase 4 (RFQs) — no SMS OTP yet, just a name/phone
 * capture that sets a signed cookie. Phase 1 replaces the capture step with real
 * OTP verification but keeps this same cookie/session shape, so RFQ/order code
 * doesn't need to change later. */
import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sign, unsign } from "@/lib/signedCookie";

const COOKIE_NAME = "nx_buyer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function getCurrentBuyerId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return unsign(raw);
}

export async function getCurrentBuyer() {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) return null;
  return prisma.buyer.findUnique({ where: { id: buyerId } });
}

/** Sets the session cookie. Must be called from a Server Action or Route Handler. */
export async function setBuyerSession(buyerId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(buyerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearBuyerSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Finds or creates a Buyer by phone and starts a session for them (registration). */
export async function identifyBuyer(input: {
  phone: string;
  name: string;
  companyName?: string;
  gstNumber?: string;
  city?: string;
}) {
  const buyer = await prisma.buyer.upsert({
    where: { phone: input.phone },
    update: { name: input.name, companyName: input.companyName, gstNumber: input.gstNumber, city: input.city },
    create: input,
  });
  await setBuyerSession(buyer.id);
  return buyer;
}

/** Logs into an existing Buyer by phone. Returns null (no session set) if none exists. */
export async function loginExistingBuyer(phone: string) {
  const buyer = await prisma.buyer.findUnique({ where: { phone } });
  if (!buyer) return null;
  await setBuyerSession(buyer.id);
  return buyer;
}
