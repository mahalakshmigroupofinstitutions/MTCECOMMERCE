/* Stopgap buyer identity for Phase 4 (RFQs) — no SMS OTP yet, just a name/phone
 * capture that sets a signed cookie. Phase 1 replaces the capture step with real
 * OTP verification but keeps this same cookie/session shape, so RFQ/order code
 * doesn't need to change later. */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "nx_buyer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env var is required");
  return s;
}

function sign(value: string) {
  const sig = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

function unsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

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

/** Finds or creates a Buyer by phone and starts a session for them. */
export async function identifyBuyer(input: { phone: string; name: string; companyName?: string; city?: string }) {
  const buyer = await prisma.buyer.upsert({
    where: { phone: input.phone },
    update: { name: input.name, companyName: input.companyName, city: input.city },
    create: input,
  });
  await setBuyerSession(buyer.id);
  return buyer;
}
