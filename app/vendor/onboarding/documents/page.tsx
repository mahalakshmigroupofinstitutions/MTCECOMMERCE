import { requireOnboardingStep } from "@/lib/vendorOnboarding";
import { saveOnboardingDocumentsAction } from "@/app/vendor/onboarding/actions";
import { SubmitButton, FileInput, FormField, CatalogImage, buttonClassName } from "@/components/ui";
import { OnboardingStepper } from "@/components/vendor/OnboardingStepper";
import type { SupplierDocumentType } from "@/lib/generated/prisma/client";

export const revalidate = 0;

const DOCUMENT_LABELS: Record<SupplierDocumentType, string> = {
  GST_CERTIFICATE: "GST certificate",
  PAN_CARD: "PAN card",
  BUSINESS_REGISTRATION: "Business registration / trade license",
  MSME_CERTIFICATE: "MSME certificate",
  AUTHORIZED_PERSON_ID: "Authorized person ID",
};

export default async function OnboardingDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [supplier, { error }] = await Promise.all([requireOnboardingStep("documents"), searchParams]);
  const uploaded = new Map(supplier.documents.map((doc) => [doc.type, doc]));

  return (
    <div>
      <OnboardingStepper current="documents" />

      <h1 className="mt-6 text-lg font-extrabold text-ink">Business verification</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Upload documents to verify your business. GST certificate and PAN card are required to submit for review.
      </p>

      {error === "missingDocs" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          GST certificate and PAN card are required.
        </p>
      )}

      {uploaded.size > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-wash p-3.5">
          <p className="text-[11.5px] font-bold text-ink">Already uploaded</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {[...uploaded.values()].map((doc) => (
              <li key={doc.id}>
                <a
                  href={`/api/vendor/documents/${doc.id}`}
                  className="text-[12.5px] font-semibold text-ink underline"
                  target="_blank"
                >
                  {DOCUMENT_LABELS[doc.type]} — {doc.fileName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={saveOnboardingDocumentsAction} className="mt-5 flex flex-col gap-3.5" encType="multipart/form-data">
        <FormField htmlFor="gstCertificate" label="GST certificate" required>
          <FileInput id="gstCertificate" name="gstCertificate" required={!uploaded.has("GST_CERTIFICATE")} />
        </FormField>

        <FormField htmlFor="panCard" label="PAN card" required>
          <FileInput id="panCard" name="panCard" required={!uploaded.has("PAN_CARD")} />
        </FormField>

        <FormField htmlFor="businessRegistration" label="Business registration / trade license" hint="Optional">
          <FileInput id="businessRegistration" name="businessRegistration" />
        </FormField>

        <FormField htmlFor="msmeCertificate" label="MSME certificate" hint="Optional">
          <FileInput id="msmeCertificate" name="msmeCertificate" />
        </FormField>

        <FormField htmlFor="authorizedPersonId" label="Authorized person ID" hint="Optional">
          <FileInput id="authorizedPersonId" name="authorizedPersonId" />
        </FormField>

        <FormField htmlFor="companyLogo" label="Company logo" hint="Optional — shown on your public storefront">
          {supplier.imageUrl && (
            <CatalogImage src={supplier.imageUrl} label="Current logo" height={80} className="mb-2 w-20" />
          )}
          <FileInput id="companyLogo" name="companyLogo" accept="image/*" />
        </FormField>

        <SubmitButton pendingText="Uploading…" className={buttonClassName({ variant: "success", full: true, size: "lg" })}>
          Continue
        </SubmitButton>
      </form>
    </div>
  );
}
