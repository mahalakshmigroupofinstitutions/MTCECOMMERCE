/* Vendor authorization guards.
 *
 * Two distinct gates, deliberately kept apart:
 *   - signed in            → may set up their shop, list products, edit profile
 *   - signed in + APPROVED → may additionally use marketplace features (RFQ
 *                            inbox, quoting) and publish the shop
 *
 * Shop Setup intentionally sits on the weaker gate: /vendor/pending tells
 * vendors they can keep building their shop while verification is in progress.
 * Nothing they build is buyer-visible until approval (see lib/vendorShop.ts). */
import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { ONBOARDING_STEPS } from "@/lib/vendorOnboarding";

export { isApprovedVendor } from "@/lib/vendor";

/** The authenticated vendor's supplier id, or a redirect to login. Every Shop
 * Setup entry point derives identity here — a supplierId is never accepted
 * from the client. */
export async function requireVendorId(nextPath: string): Promise<string> {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect(`/vendor/login?next=${encodeURIComponent(nextPath)}`);
  return supplierId;
}

/** Guard for the Shop Setup wizard. Deliberately does NOT require approval —
 * a vendor awaiting verification may build their shop, it just stays hidden.
 * DRAFT vendors haven't finished account onboarding yet, so they're sent back
 * to it rather than into a second, parallel wizard. Returns the supplier row so
 * the page can prefill from data the vendor has already given. */
export async function requireVendorForShopSetup(nextPath: string) {
  const supplierId = await requireVendorId(nextPath);

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) redirect(`/vendor/login?next=${encodeURIComponent(nextPath)}`);
  if (supplier.onboardingStatus === "DRAFT") {
    redirect(`/vendor/onboarding/${ONBOARDING_STEPS[supplier.onboardingStep] ?? ONBOARDING_STEPS[0]}`);
  }

  return supplier;
}

/** Guard for verification-gated features. Sends DRAFT vendors back to the
 * onboarding step they stopped on, and everyone else awaiting (or refused) a
 * decision to /vendor/pending, which explains the state. */
export async function requireApprovedVendorId(nextPath: string): Promise<string> {
  const supplierId = await requireVendorId(nextPath);

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { onboardingStatus: true, onboardingStep: true },
  });
  if (!supplier) redirect(`/vendor/login?next=${encodeURIComponent(nextPath)}`);
  if (supplier.onboardingStatus === "DRAFT") {
    redirect(`/vendor/onboarding/${ONBOARDING_STEPS[supplier.onboardingStep] ?? ONBOARDING_STEPS[0]}`);
  }
  if (supplier.onboardingStatus !== "APPROVED") redirect("/vendor/pending");

  return supplierId;
}
