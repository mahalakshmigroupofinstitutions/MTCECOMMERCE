import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { FileInput, FormField, Input, Select, SubmitButton, buttonClassName } from "@/components/ui";
import { ShopStepShell } from "@/components/vendor/ShopStepShell";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { ALLOWED_CERTIFICATION_TYPES, MAX_CERTIFICATION_BYTES } from "@/lib/localFileStorage";
import { getOrCreateShop, getShopCompletion, type VendorShop } from "@/lib/vendorShop";
import {
  addShopCertificationAction,
  deleteShopCertificationAction,
  updateShopCertificationAction,
} from "@/app/vendor/shop/actions";
import type { ShopCertificationType } from "@/lib/generated/prisma/client";

export const revalidate = 0;

const ACCEPT = ALLOWED_CERTIFICATION_TYPES.join(",");
const MAX_MB = Math.round(MAX_CERTIFICATION_BYTES / (1024 * 1024));
const MAX_CERTIFICATIONS = 20;

/* Labels for the actual ShopCertificationType enum. These are shop marketing
 * credentials — KYC documents (GST, PAN…) are a separate onboarding system. */
const TYPE_LABELS: Record<ShopCertificationType, string> = {
  ISO: "ISO certificate",
  MSME: "MSME / Udyam registration",
  BIS: "BIS certification",
  AUTHORIZED_DEALER: "Authorised dealer letter",
  COMPANY_BROCHURE: "Company brochure",
  PROJECT_PORTFOLIO: "Project portfolio",
  OTHER: "Other",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [ShopCertificationType, string][];

const TITLE_HINT = "Add a certificate name, reference number, or other identifying detail.";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** One stored certification. Three separate forms because Replace and Delete
 * are distinct Server Actions, and nesting forms isn't valid HTML — this keeps
 * the whole card working without JavaScript. */
function CertificationCard({ certification }: { certification: VendorShop["certifications"][number] }) {
  const uploaded = certification.uploadedAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold text-ink">{TYPE_LABELS[certification.type]}</div>
          {certification.title && <div className="mt-0.5 text-[12.5px] text-sub">{certification.title}</div>}
          {/* fileName is the vendor's own original filename; the stored path is
              never rendered. */}
          <div className="mt-1 text-[11.5px] text-faint">
            {certification.fileName} · {formatSize(certification.fileSize)} · Added {uploaded}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Private document: served only by the authenticated, ownership-
              checked API route. */}
          <Link
            href={`/api/vendor/shop-certifications/${certification.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName({ variant: "outline", size: "sm" })}
          >
            <Icon name="doc" size={14} strokeWidth={2} /> View
          </Link>

          <form action={deleteShopCertificationAction}>
            <input type="hidden" name="certificationId" value={certification.id} />
            <SubmitButton
              pendingText="Removing…"
              className={buttonClassName({ variant: "danger", size: "sm" })}
            >
              Delete
            </SubmitButton>
          </form>
        </div>
      </div>

      <form action={updateShopCertificationAction} className="mt-3 border-t border-line pt-3">
        <input type="hidden" name="certificationId" value={certification.id} />
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <FormField htmlFor={`type-${certification.id}`} label="Type">
            <Select id={`type-${certification.id}`} name="type" defaultValue={certification.type}>
              {TYPE_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor={`title-${certification.id}`} label="Title / reference">
            <Input
              id={`title-${certification.id}`}
              name="title"
              maxLength={200}
              defaultValue={certification.title ?? ""}
            />
          </FormField>

          <SubmitButton pendingText="Saving…" className={buttonClassName({ variant: "success", size: "sm" })}>
            Update
          </SubmitButton>
        </div>

        <div className="mt-3">
          <FormField
            htmlFor={`file-${certification.id}`}
            label="Replace document"
            hint={`Optional. Leave empty to keep the current file. PDF, PNG, JPG or WebP, up to ${MAX_MB} MB.`}
          >
            <FileInput id={`file-${certification.id}`} name="file" accept={ACCEPT} />
          </FormField>
        </div>
      </form>
    </li>
  );
}

export default async function ShopCertificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supplier = await requireVendorForShopSetup("/vendor/shop/certifications");

  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);
  const atLimit = shop.certifications.length >= MAX_CERTIFICATIONS;

  return (
    <ShopStepShell
      step="certifications"
      description="Credentials and company documents that build buyer confidence. This step is optional."
      completion={completion}
      error={error}
      saved={saved}
    >
      {shop.certifications.length === 0 ? (
        <div className="rounded-2xl border border-line bg-wash px-6 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-paper text-ink">
            <Icon name="verified" size={21} />
          </div>
          <h2 className="mt-3 text-[14px] font-extrabold text-ink">No certifications yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-sub">
            Add an ISO or MSME certificate, a brochure, or a project portfolio. Documents stay private — only you can
            open them.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shop.certifications.map((certification) => (
            <CertificationCard key={certification.id} certification={certification} />
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-2xl border border-line p-4">
        <h2 className="text-[13.5px] font-extrabold text-ink">Add a certification</h2>
        <p className="mt-1 text-[12px] text-sub">
          {atLimit
            ? `You've reached the maximum of ${MAX_CERTIFICATIONS} certifications. Delete one to add another.`
            : `${shop.certifications.length} of ${MAX_CERTIFICATIONS} added.`}
        </p>

        <form action={addShopCertificationAction} className="mt-3.5 flex flex-col gap-3.5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField htmlFor="type" label="Certification type" required>
              <Select id="type" name="type" required defaultValue="" disabled={atLimit}>
                <option value="" disabled>
                  Choose one
                </option>
                {TYPE_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField htmlFor="title" label="Title / reference" hint={TITLE_HINT}>
              <Input
                id="title"
                name="title"
                maxLength={200}
                placeholder="ISO 9001:2015 — cert 12345"
                disabled={atLimit}
              />
            </FormField>
          </div>

          <FormField
            htmlFor="file"
            label="Document"
            required
            hint={`PDF, PNG, JPG or WebP, up to ${MAX_MB} MB. Kept private to your account.`}
          >
            <FileInput id="file" name="file" accept={ACCEPT} required disabled={atLimit} />
          </FormField>

          <div>
            <SubmitButton
              pendingText="Uploading…"
              disabled={atLimit}
              className={buttonClassName({ variant: "success", size: "md", className: "w-full sm:w-auto" })}
            >
              <Icon name="plus" size={16} strokeWidth={2} /> Add certification
            </SubmitButton>
          </div>
        </form>
      </div>

      {/* No step-level save: add/replace/delete each persist on their own, so a
          plain link is honest here rather than a no-op "save" button. */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
        {/* Certifications is the last active step, so "continue" leads to the
            preview — Social Links is on hold. */}
        <Link
          href="/vendor/shop/preview"
          className={buttonClassName({ size: "md", className: "w-full sm:w-auto" })}
        >
          Continue <Icon name="arrow-right" size={16} strokeWidth={2} />
        </Link>
        <Link
          href="/vendor/shop"
          className={buttonClassName({ variant: "outline", size: "md", className: "w-full sm:w-auto" })}
        >
          Finish later
        </Link>
        <span className="text-[11.5px] text-faint sm:mr-auto">
          Certifications are optional — each change above saves immediately.
        </span>
      </div>
    </ShopStepShell>
  );
}
