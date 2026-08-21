/* Admin identity — mirrors lib/vendorSession.ts and lib/session.ts but keeps
 * its own cookie, so one browser can hold buyer, vendor, and admin sessions at
 * once. Admins are created out-of-band (prisma/createAdmin.ts); there is no
 * self-signup. */
import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sign, unsign } from "@/lib/signedCookie";
import { verifyPassword } from "@/lib/passwordAuth";

const COOKIE_NAME = "nx_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

export async function getCurrentAdminId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return unsign(raw);
}

export async function getCurrentAdmin() {
  const adminId = await getCurrentAdminId();
  if (!adminId) return null;
  return prisma.admin.findUnique({ where: { id: adminId } });
}

export async function setAdminSession(adminId: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(adminId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Returns null (no session set) on unknown email or bad password. */
export async function loginAdmin(input: { email: string; password: string }) {
  const admin = await prisma.admin.findUnique({ where: { email: input.email } });
  if (!admin) return null;

  const ok = await verifyPassword(input.password, admin.passwordHash);
  if (!ok) return null;

  await setAdminSession(admin.id);
  return admin;
}
