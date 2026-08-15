/* Vendor identity stopgap — mirrors lib/session.ts's buyer stopgap (no SMS OTP
 * yet, just a name/phone capture) but keeps its own cookie so one browser can
 * hold both a buyer and a vendor session at once. */
import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sign, unsign } from "@/lib/signedCookie";
import { uniqueSlug } from "@/lib/slug";
import { hashPassword, verifyPassword } from "@/lib/passwordAuth";
import { sendVendorVerificationEmailStub } from "@/lib/mailer";

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

/** Email/password vendor sign-up — starts the DRAFT onboarding wizard
 * (lib/vendorOnboarding.ts). Coexists with identifyVendor's phone flow above;
 * both converge on the same nx_vendor session cookie. */
export async function registerVendor(input: {
  email: string;
  password: string;
  contactName: string;
  phone: string;
  dateOfBirth?: Date;
}): Promise<{ error: "exists" } | { supplier: Awaited<ReturnType<typeof prisma.supplier.create>> }> {
  const [existingEmail, existingPhone] = await Promise.all([
    prisma.supplier.findUnique({ where: { email: input.email } }),
    prisma.supplier.findUnique({ where: { phone: input.phone } }),
  ]);
  if (existingEmail || existingPhone) return { error: "exists" };

  const passwordHash = await hashPassword(input.password);
  const placeholderName = input.email.split("@")[0];
  const created = await prisma.supplier.create({
    data: {
      email: input.email,
      passwordHash,
      contactName: input.contactName,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      acceptedTermsAt: new Date(),
      name: placeholderName,
      city: "",
      slug: uniqueSlug(placeholderName),
      verified: false,
      tags: [],
      onboardingStatus: "DRAFT",
      onboardingStep: 0,
    },
  });
  await sendVendorVerificationEmailStub(created.email!);
  await setVendorSession(created.id);
  return { supplier: created };
}

export async function loginVendorWithPassword(input: { email: string; password: string }) {
  const supplier = await prisma.supplier.findUnique({ where: { email: input.email } });
  if (!supplier || !supplier.passwordHash) return null;

  const ok = await verifyPassword(input.password, supplier.passwordHash);
  if (!ok) return null;

  await setVendorSession(supplier.id);
  return supplier;
}
