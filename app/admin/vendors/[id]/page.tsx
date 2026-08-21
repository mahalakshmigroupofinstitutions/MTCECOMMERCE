import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName, SubmitButton, Textarea, CatalogImage } from "@/components/ui";
import { VendorStatusBadge } from "@/components/admin/VendorStatusBadge";
import { OnboardingSummarySection } from "@/components/vendor/OnboardingSummarySection";
import { requireAdmin, getVendorSubmission } from "@/lib/adminReview";
import {
  approveVendorAction,
  rejectVendorAction,
  requestChangesAction,
  claimVendorAction,
} from "@/app/admin/actions";
import type { SupplierDocumentType } from "@/lib/generated/prisma/client";

export const revalidate = 0;

const DOCUMENT_LABELS: Record<SupplierDocumentType, string> = {
  GST_CERTIFICATE: "GST certificate",
  PAN_CARD: "PAN card",
  BUSINESS_REGISTRATION: "Business registration",
  MSME_CERTIFICATE: "MSME certificate",
  AUTHORIZED_PERSON_ID: "Authorized person ID",
};

export default async function AdminVendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();

  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const vendor = await getVendorSubmission(id);
  if (!vendor) notFound();

  const bank = vendor.bankDetail;
  const decided = vendor.onboardingStatus === "APPROVED" || vendor.onboardingStatus === "REJECTED";

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sub">
        <Icon name="arrow-left" size={14} /> Back to queue
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-extrabold text-ink">{vendor.name}</h1>
        <VendorStatusBadge status={vendor.onboardingStatus} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-sub">
        {vendor.contactName && <span>{vendor.contactName}</span>}
        {vendor.email && <span>{vendor.email}</span>}
        {vendor.phone && <span>{vendor.phone}</span>}
      </div>

      {vendor.reviewedAt && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] text-sub">
          Last reviewed {vendor.reviewedAt.toLocaleString()}
          {vendor.reviewedBy && <> by <strong className="text-ink">{vendor.reviewedBy.name}</strong></>}
          {vendor.reviewNote && (
            <>
              {" — "}
              <span className="text-ink">{vendor.reviewNote}</span>
            </>
          )}
        </p>
      )}

      {vendor.imageUrl && (
        <CatalogImage src={vendor.imageUrl} label="Company logo" height={80} className="mt-4 w-20" />
      )}

      <div className="mt-5 flex flex-col gap-3">
        <OnboardingSummarySection
          title="Business information"
          rows={[
            { label: "Business name", value: vendor.name },
            { label: "Business type", value: vendor.businessType },
            { label: "Business category", value: vendor.businessCategory?.name },
            { label: "Years in business", value: String(vendor.years) },
            { label: "GST number", value: vendor.gstNumber },
            { label: "PAN number", value: vendor.panNumber },
            { label: "Address", value: vendor.address },
            { label: "City", value: vendor.city },
            { label: "State", value: vendor.state },
            { label: "Pincode", value: vendor.pincode },
            { label: "Website", value: vendor.website },
          ]}
        />

        <div className="rounded-2xl border border-line p-5">
          <h2 className="text-[13.5px] font-extrabold text-ink">Documents</h2>
          {vendor.documents.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-faint">No documents uploaded.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {vendor.documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2">
                  <Icon name="doc" size={14} className="text-sub" />
                  <a
                    href={`/api/vendor/documents/${doc.id}`}
                    target="_blank"
                    className="text-[13px] font-semibold text-ink underline"
                  >
                    {DOCUMENT_LABELS[doc.type]}
                  </a>
                  <span className="text-[11.5px] text-faint">{doc.fileName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <OnboardingSummarySection
          title="Bank & payout details"
          rows={[
            { label: "Account holder", value: bank?.accountHolder },
            { label: "Bank name", value: bank?.bankName },
            { label: "Account number", value: bank?.accountNumber },
            { label: "IFSC code", value: bank?.ifscCode },
            { label: "Account type", value: bank?.accountType },
            { label: "UPI ID", value: bank?.upiId },
            { label: "Bank verification", value: bank?.verificationStatus },
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-wash p-5">
        <h2 className="text-[13.5px] font-extrabold text-ink">Decision</h2>
        {error === "note" && (
          <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-[12.5px] font-semibold text-ink">
            A note is required when rejecting or requesting changes.
          </p>
        )}
        {decided && (
          <p className="mt-2 text-[12.5px] text-sub">
            This application has already been decided — submitting again will overwrite the decision.
          </p>
        )}

        <form className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="supplierId" value={vendor.id} />
          <div>
            <label htmlFor="note" className="mb-1.5 block text-[12.5px] font-bold text-ink">
              Note to vendor
            </label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              placeholder="Required when rejecting or requesting changes — the vendor sees this."
              defaultValue={vendor.reviewNote ?? ""}
            />
          </div>

          <div className="flex flex-wrap gap-2.5">
            <SubmitButton formAction={approveVendorAction} pendingText="Approving…" className={buttonClassName()}>
              Approve
            </SubmitButton>
            <SubmitButton
              formAction={requestChangesAction}
              pendingText="Sending…"
              className={buttonClassName({ variant: "outline" })}
            >
              Request changes
            </SubmitButton>
            <SubmitButton
              formAction={rejectVendorAction}
              pendingText="Rejecting…"
              className={buttonClassName({ variant: "outline" })}
            >
              Reject
            </SubmitButton>
            {vendor.onboardingStatus === "PENDING_VERIFICATION" && (
              <SubmitButton
                formAction={claimVendorAction}
                pendingText="Claiming…"
                className={buttonClassName({ variant: "ghost" })}
              >
                Mark under review
              </SubmitButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
