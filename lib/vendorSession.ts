/* Vendor identity stopgap — mirrors lib/session.ts's buyer stopgap (no SMS OTP
 * yet, just a name/phone capture) but keeps its own cookie so one browser can
 * hold both a buyer and a vendor session at once. */
import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sign, unsign } from "@/lib/signedCookie";
import { uniqueSlug } from "@/lib/slug";

const COOKIE_NAME = "nx_vendor";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function getCurrentSupplierId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return unsign(raw);
}

export async function getCurrentVendor() {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) return null;
  return prisma.supplier.findUnique({ where: { id: supplierId } });
}

export async function setVendorSession(supplierId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(supplierId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearVendorSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Logs into an existing Supplier by phone as-is (never overwrites seeded
 * business data from a login form), or creates a new unverified one. */
export async function identifyVendor(input: { phone: string; name: string; city: string }) {
  const existing = await prisma.supplier.findUnique({ where: { phone: input.phone } });
  if (existing) {
    await setVendorSession(existing.id);
    return existing;
  }

  const created = await prisma.supplier.create({
    data: {
      phone: input.phone,
      name: input.name,
      city: input.city,
      slug: uniqueSlug(input.name),
      verified: false,
      tags: [],
    },
  });
  await setVendorSession(created.id);
  return created;
}
