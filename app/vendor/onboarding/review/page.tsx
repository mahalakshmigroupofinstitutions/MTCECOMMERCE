import { requireOnboardingStep, getOnboardingSummary } from "@/lib/vendorOnboarding";
import { submitOnboardingForReviewAction } from "@/app/vendor/onboarding/actions";
import { SubmitButton, buttonClassName } from "@/components/ui";
import { OnboardingStepper } from "@/components/vendor/OnboardingStepper";
import { OnboardingSummarySection } from "@/components/vendor/OnboardingSummarySection";
import type { SupplierDocumentType } from "@/lib/generated/prisma/client";

export const revalidate = 0;

const DOCUMENT_LABELS: Record<SupplierDocumentType, string> = {
  GST_CERTIFICATE: "GST certificate",
  PAN_CARD: "PAN card",
  BUSINESS_REGISTRATION: "Business registration",
  MSME_CERTIFICATE: "MSME certificate",
  AUTHORIZED_PERSON_ID: "Authorized person ID",
};

function maskAccountNumber(accountNumber: string) {
  if (accountNumber.length <= 4) return accountNumber;
  return `${"•".repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
}

export default async function OnboardingReviewPage() {
  const guarded = await requireOnboardingStep("review");
  const supplier = (await getOnboardingSummary(guarded.id))!;
  const bank = supplier.bankDetail;

  return (
    <div>
      <OnboardingStepper current="review" />

      <h1 className="mt-6 text-lg font-extrabold text-ink">Review & submit</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Double-check everything below, then submit your application for admin verification.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <OnboardingSummarySection
          title="Business information"
          editHref="/vendor/onboarding/business"
          rows={[
            { label: "Business name", value: supplier.name },
            { label: "Business type", value: supplier.businessType },
            { label: "Business category", value: supplier.businessCategory?.name },
            { label: "Years in business", value: String(supplier.years) },
            { label: "GST number", value: supplier.gstNumber },
            { label: "PAN number", value: supplier.panNumber },
            { label: "Address", value: supplier.address },
            { label: "City", value: supplier.city },
            { label: "State", value: supplier.state },
            { label: "Pincode", value: supplier.pincode },
            { label: "Website", value: supplier.website },
          ]}
        />

        <OnboardingSummarySection
          title="Business verification"
          editHref="/vendor/onboarding/documents"
          rows={[
            ...supplier.documents.map((doc) => ({ label: DOCUMENT_LABELS[doc.type], value: doc.fileName })),
            { label: "Company logo", value: supplier.imageUrl ? "Uploaded" : undefined },
          ]}
        />

        <OnboardingSummarySection
          title="Bank & payout details"
          editHref="/vendor/onboarding/bank"
          rows={[
            { label: "Account holder", value: bank?.accountHolder },
            { label: "Bank name", value: bank?.bankName },
            { label: "Account number", value: bank ? maskAccountNumber(bank.accountNumber) : undefined },
            { label: "IFSC code", value: bank?.ifscCode },
            { label: "Account type", value: bank?.accountType },
            { label: "UPI ID", value: bank?.upiId },
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-wash p-5">
        <p className="text-[13.5px] font-bold text-ink">Ready to submit?</p>
        <p className="mt-1 text-[12.5px] text-sub">
          Your application will be reviewed by our team, typically within 24–48 hours. You can keep setting up your
          shop (products, banners) while you wait — it just won&rsquo;t be visible to buyers until you&rsquo;re
          approved.
        </p>
        <form action={submitOnboardingForReviewAction} className="mt-4">
          <SubmitButton pendingText="Submitting…" className={buttonClassName({ variant: "success", full: true, size: "lg" })}>
            Submit for admin verification
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
