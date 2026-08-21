"use server";

import { redirect } from "next/navigation";
import { str, withErrorParam } from "@/lib/formData";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import {
  ONBOARDING_STEPS,
  saveOnboardingBusiness,
  saveOnboardingDocuments,
  saveOnboardingBank,
  submitOnboardingForReview,
  getSupplierDocuments,
  type OnboardingDocumentInput,
} from "@/lib/vendorOnboarding";
import type { SupplierBusinessType, SupplierAccountType, SupplierDocumentType } from "@/lib/generated/prisma/client";

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function file(formData: FormData, key: string): File | undefined {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
}

export async function saveOnboardingBusinessAction(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const name = str(formData, "name");
  const businessType = str(formData, "businessType") as SupplierBusinessType | undefined;
  const businessCategoryId = str(formData, "businessCategoryId");
  const yearsRaw = str(formData, "years");
  const address = str(formData, "address");
  const city = str(formData, "city");
  const state = str(formData, "state");
  const pincode = str(formData, "pincode");

  if (!name || !businessType || !businessCategoryId || !yearsRaw || !address || !city || !state || !pincode) {
    redirect(withErrorParam("/vendor/onboarding/business", "identify"));
  }

  await saveOnboardingBusiness(supplierId!, {
    name: name!,
    businessType: businessType!,
    businessCategoryId: businessCategoryId!,
    years: Math.max(0, Math.round(Number(yearsRaw))),
    gstNumber: str(formData, "gstNumber"),
    panNumber: str(formData, "panNumber"),
    address: address!,
    city: city!,
    state: state!,
    pincode: pincode!,
    website: str(formData, "website"),
  });

  redirect(`/vendor/onboarding/${ONBOARDING_STEPS[1]}`);
}

const DOCUMENT_FIELDS: { field: string; type: SupplierDocumentType }[] = [
  { field: "gstCertificate", type: "GST_CERTIFICATE" },
  { field: "panCard", type: "PAN_CARD" },
  { field: "businessRegistration", type: "BUSINESS_REGISTRATION" },
  { field: "msmeCertificate", type: "MSME_CERTIFICATE" },
  { field: "authorizedPersonId", type: "AUTHORIZED_PERSON_ID" },
];

export async function saveOnboardingDocumentsAction(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const gstCertificate = file(formData, "gstCertificate");
  const panCard = file(formData, "panCard");

  const existingTypes = new Set((await getSupplierDocuments(supplierId!)).map((doc) => doc.type));
  const hasGst = Boolean(gstCertificate) || existingTypes.has("GST_CERTIFICATE");
  const hasPan = Boolean(panCard) || existingTypes.has("PAN_CARD");
  if (!hasGst || !hasPan) {
    redirect(withErrorParam("/vendor/onboarding/documents", "missingDocs"));
  }

  const documents: OnboardingDocumentInput[] = DOCUMENT_FIELDS.map(({ field, type }) => {
    const uploaded = file(formData, field);
    return uploaded ? { type, file: uploaded } : null;
  }).filter((doc): doc is OnboardingDocumentInput => doc !== null);

  await saveOnboardingDocuments(supplierId!, {
    documents,
    companyLogo: file(formData, "companyLogo"),
  });

  redirect(`/vendor/onboarding/${ONBOARDING_STEPS[2]}`);
}

export async function saveOnboardingBankAction(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const accountHolder = str(formData, "accountHolder");
  const bankName = str(formData, "bankName");
  const accountNumber = str(formData, "accountNumber");
  const confirmAccountNumber = str(formData, "confirmAccountNumber");
  const ifscCode = str(formData, "ifscCode")?.toUpperCase();
  const accountType = str(formData, "accountType") as SupplierAccountType | undefined;

  if (!accountHolder || !bankName || !accountNumber || !ifscCode || !accountType) {
    redirect(withErrorParam("/vendor/onboarding/bank", "identify"));
  }
  if (accountNumber !== confirmAccountNumber) {
    redirect(withErrorParam("/vendor/onboarding/bank", "mismatch"));
  }
  if (!IFSC_PATTERN.test(ifscCode!)) {
    redirect(withErrorParam("/vendor/onboarding/bank", "ifsc"));
  }

  await saveOnboardingBank(supplierId!, {
    accountHolder: accountHolder!,
    bankName: bankName!,
    accountNumber: accountNumber!,
    ifscCode: ifscCode!,
    accountType: accountType!,
    upiId: str(formData, "upiId"),
  });

  redirect(`/vendor/onboarding/${ONBOARDING_STEPS[3]}`);
}

export async function submitOnboardingForReviewAction() {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  await submitOnboardingForReview(supplierId!);
  redirect("/vendor/pending");
}
