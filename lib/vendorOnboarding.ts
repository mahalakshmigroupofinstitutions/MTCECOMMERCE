import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { saveVendorDocument, saveVendorLogo } from "@/lib/localFileStorage";
import { sendVendorApplicationSubmittedEmailStub } from "@/lib/mailer";
import type {
  Prisma,
  SupplierBusinessType,
  SupplierDocumentType,
  SupplierAccountType,
} from "@/lib/generated/prisma/client";

export const ONBOARDING_STEPS = ["business", "documents", "bank", "review"] as const;
export type OnboardingStepSlug = (typeof ONBOARDING_STEPS)[number];

const ONBOARDING_INCLUDE = {
  businessCategory: true,
  documents: true,
  bankDetail: true,
} as const;

export type OnboardingSupplier = Prisma.SupplierGetPayload<{ include: typeof ONBOARDING_INCLUDE }>;

/** Server-Component page guard for a wizard step: bounces unauthenticated
 * visitors to login, already-decided suppliers (not DRAFT — either never
 * started the email/password path, or already submitted) to the dashboard,
 * and forward-jumpers back to their real resume step. Returns the supplier
 * row (with onboarding relations) so the page can prefill its form. */
export async function requireOnboardingStep(slug: OnboardingStepSlug): Promise<OnboardingSupplier> {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect(`/vendor/login?next=${encodeURIComponent(`/vendor/onboarding/${slug}`)}`);

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    include: ONBOARDING_INCLUDE,
  });
  if (!supplier) redirect("/vendor/login");

  if (supplier.onboardingStatus !== "DRAFT") redirect("/vendor");

  const targetIndex = ONBOARDING_STEPS.indexOf(slug);
  if (supplier.onboardingStep < targetIndex) {
    redirect(`/vendor/onboarding/${ONBOARDING_STEPS[supplier.onboardingStep]}`);
  }

  return supplier;
}

async function markStepComplete(supplierId: string, stepIndex: number, extra: Record<string, unknown>) {
  const current = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { onboardingStep: true },
  });
  const onboardingStep = Math.max(current?.onboardingStep ?? 0, stepIndex + 1);
  return prisma.supplier.update({ where: { id: supplierId }, data: { ...extra, onboardingStep } });
}

export async function saveOnboardingBusiness(
  supplierId: string,
  input: {
    name: string;
    businessType: SupplierBusinessType;
    businessCategoryId: string;
    years: number;
    gstNumber?: string;
    panNumber?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    website?: string;
  },
) {
  return markStepComplete(supplierId, 0, input);
}

export interface OnboardingDocumentInput {
  type: SupplierDocumentType;
  file: File;
}

export async function saveOnboardingDocuments(
  supplierId: string,
  input: { documents: OnboardingDocumentInput[]; companyLogo?: File },
) {
  for (const doc of input.documents) {
    const saved = await saveVendorDocument(doc.file, supplierId);
    await prisma.supplierDocument.create({ data: { supplierId, type: doc.type, ...saved } });
  }

  const extra: Record<string, unknown> = {};
  if (input.companyLogo) {
    extra.imageUrl = await saveVendorLogo(input.companyLogo, supplierId);
  }

  return markStepComplete(supplierId, 1, extra);
}

export async function getSupplierDocuments(supplierId: string) {
  return prisma.supplierDocument.findMany({ where: { supplierId }, orderBy: { uploadedAt: "desc" } });
}

export async function saveOnboardingBank(
  supplierId: string,
  input: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: SupplierAccountType;
    upiId?: string;
  },
) {
  await prisma.supplierBankDetail.upsert({
    where: { supplierId },
    create: { supplierId, ...input },
    update: input,
  });
  return markStepComplete(supplierId, 2, {});
}

export async function submitOnboardingForReview(supplierId: string) {
  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: { onboardingStatus: "PENDING_VERIFICATION", onboardingStep: ONBOARDING_STEPS.length },
  });
  if (supplier.email) await sendVendorApplicationSubmittedEmailStub(supplier.email);
  return supplier;
}

export async function getOnboardingSummary(supplierId: string) {
  return prisma.supplier.findUnique({
    where: { id: supplierId },
    include: ONBOARDING_INCLUDE,
  });
}
