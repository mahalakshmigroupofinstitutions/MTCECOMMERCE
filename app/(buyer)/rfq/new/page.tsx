import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentBuyer } from "@/lib/session";
import { getCategories, getProductBySlug } from "@/lib/catalog";
import { submitRfq } from "@/app/(buyer)/rfq/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { buyerTypeLabel, effectiveGstRegistered, getProfileCompletion } from "@/lib/buyerProfile";
import {
  RFQ_DELIVERY_MODE_OPTIONS,
  RFQ_DELIVERY_TIMELINE_OPTIONS,
  RFQ_FORM_ERROR_MESSAGES,
  RFQ_PAYMENT_TERMS_OPTIONS,
  RFQ_UOM_OPTIONS,
} from "@/lib/rfqForm";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";
const selectClass = inputClass;

const ERROR_MESSAGES: Record<string, string> = {
  ...RFQ_FORM_ERROR_MESSAGES,
  attachment: "That attachment couldn’t be uploaded — check the file type and make sure it’s under 15MB.",
  target: "That product or category isn’t available any more — please choose again.",
  unexpected: "Something went wrong saving your RFQ. Please try again.",
};

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; error?: string }>;
}) {
  const { product: productSlug, error } = await searchParams;

  // RFQs need an OTP-verified buyer — the form no longer collects guest
  // name/phone. ?next= brings them straight back here (product included).
  const buyer = await getCurrentBuyer();
  if (!buyer) {
    const here = productSlug ? `/rfq/new?product=${encodeURIComponent(productSlug)}` : "/rfq/new";
    redirect(`/login?next=${encodeURIComponent(here)}`);
  }

  const [product, categories] = await Promise.all([
    productSlug ? getProductBySlug(productSlug) : null,
    getCategories(),
  ]);

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unexpected) : undefined;
  const gstRegistered = effectiveGstRegistered(buyer.gstRegistered, buyer.gstNumber);
  const completion = getProfileCompletion(buyer);
  const location = [buyer.city, buyer.state, buyer.pincode].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <h1 className="text-lg font-extrabold text-ink">Request a quote</h1>
      {product ? (
        <p className="mt-1.5 text-[13px] text-sub">
          For <b className="text-ink">{product.title}</b> from {product.supplier.name}.
        </p>
      ) : (
        <p className="mt-1.5 text-[13px] text-sub">One request goes out to multiple suppliers.</p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          {errorMessage}
        </p>
      )}

      {/* Suppliers see this saved profile alongside the RFQ — it isn't
          re-entered here; changes are made from Account details. */}
      <div className="mt-5 rounded-2xl border border-line p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-bold text-ink">Requesting as</p>
          <Link href="/account" className="text-[12px] font-bold text-ink underline">
            Edit profile
          </Link>
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
          <dt className="text-sub">Company</dt>
          <dd className="text-ink">{buyer.companyName || "—"}</dd>
          <dt className="text-sub">Contact person</dt>
          <dd className="text-ink">
            {buyer.name || "—"}
            {buyer.designation && <span className="text-sub"> · {buyer.designation}</span>}
          </dd>
          <dt className="text-sub">Phone</dt>
          <dd className="font-mono text-ink">{buyer.phone}</dd>
          {buyer.businessEmail && (
            <>
              <dt className="text-sub">Email</dt>
              <dd className="text-ink">{buyer.businessEmail}</dd>
            </>
          )}
          {buyer.buyerType && (
            <>
              <dt className="text-sub">Buyer type</dt>
              <dd className="text-ink">{buyerTypeLabel(buyer.buyerType)}</dd>
            </>
          )}
          <dt className="text-sub">GSTIN</dt>
          <dd className="font-mono text-ink">{gstRegistered ? buyer.gstNumber : gstRegistered === false ? "Not registered" : "—"}</dd>
          <dt className="text-sub">Location</dt>
          <dd className="text-ink">{location || "—"}</dd>
        </dl>
        {completion.percent < 100 && (
          <p className="mt-3 text-[12px] text-sub">
            Your profile is {completion.percent}% complete. A complete profile helps suppliers quote faster —{" "}
            <Link href="/account" className="font-bold text-ink underline">
              finish it in Account details
            </Link>
            .
          </p>
        )}
      </div>

      <form action={submitRfq} className="mt-5 flex flex-col gap-4" encType="multipart/form-data">
        {productSlug && <input type="hidden" name="productSlug" value={productSlug} />}
        {product ? (
          <>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="categoryId" value={product.categoryId} />
          </>
        ) : (
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Category</div>
            <select name="categoryId" className={selectClass} defaultValue="">
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Item description & specs</div>
          <textarea
            name="notes"
            rows={3}
            placeholder="Model/grade, brand preference, ISI standards, delivery location…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Quantity</div>
            <input
              name="quantity"
              required
              placeholder={product ? `e.g. ${product.moq}` : "e.g. 500"}
              defaultValue={product ? `${product.moq}` : ""}
              className={inputClass}
            />
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Unit of Measure</div>
            <select name="uom" className={selectClass} defaultValue={product?.moqUnit ?? ""}>
              <option value="" disabled>
                Select
              </option>
              {RFQ_UOM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Target price / unit (optional)</div>
          <input name="targetPrice" placeholder="₹ Click to enter target rate" className={inputClass} />
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Concession / discount requested (optional)</div>
          <input name="concession" placeholder="e.g. 10% off for bulk order" className={inputClass} />
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">
            Spec sheet / BOQ attachment (optional)
          </div>
          <label
            htmlFor="specSheet"
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center transition hover:border-ink/40"
          >
            <span className="text-[13px] font-semibold text-ink">Click to upload a file</span>
            <span className="text-[11.5px] text-faint">PDF, JPG, PNG, DWG, Excel — up to 15MB</span>
            <input
              id="specSheet"
              type="file"
              name="specSheet"
              accept=".pdf,.jpg,.jpeg,.png,.dwg,.xlsx,.xls"
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Expected delivery timeline</div>
            <select name="deliveryTimeline" className={selectClass} defaultValue="">
              <option value="" disabled>
                Select
              </option>
              {RFQ_DELIVERY_TIMELINE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Preferred delivery mode</div>
            <select name="deliveryMode" className={selectClass} defaultValue="">
              <option value="" disabled>
                Select
              </option>
              {RFQ_DELIVERY_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Preferred payment terms</div>
          <select name="paymentTerms" className={selectClass} defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {RFQ_PAYMENT_TERMS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Target delivery date (optional)</div>
            <input type="date" name="targetDeliveryDate" className={inputClass} />
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">RFQ submission deadline</div>
            <input type="date" name="submissionDeadline" className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3">
          <SubmitButton
            pendingText="Saving…"
            formAction={submitRfq}
            className={buttonClassName({ variant: "outline", size: "lg" })}
            name="intent"
            value="draft"
          >
            Save RFQ Draft
          </SubmitButton>
          <SubmitButton pendingText="Submitting…" className={buttonClassName({ full: true, size: "lg" })}>
            Submit RFQ for Vendor Quotations
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}