import { getCurrentBuyerId } from "@/lib/session";
import { getCategories, getProductBySlug } from "@/lib/catalog";
import { submitRfq } from "@/app/(buyer)/rfq/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";
const selectClass = inputClass;

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; error?: string }>;
}) {
  const { product: productSlug, error } = await searchParams;
  const buyerId = await getCurrentBuyerId();

  const [product, categories] = await Promise.all([
    productSlug ? getProductBySlug(productSlug) : null,
    getCategories(),
  ]);

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
      {error === "quantity" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please enter a quantity.
        </p>
      )}

      <form action={submitRfq} className="mt-5 flex flex-col gap-4" encType="multipart/form-data">
        {!buyerId && (
          <div className="rounded-2xl border border-line p-4">
            <p className="mb-3 text-[13px] font-bold text-ink">Your details</p>
            {error === "identify" && (
              <p className="mb-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
                Please enter your name and a valid phone number.
              </p>
            )}
            <div className="flex flex-col gap-3">
              <input name="guestName" required placeholder="Your name" className={inputClass} />
              <input name="guestPhone" required type="tel" placeholder="Mobile number" className={inputClass} />
              <input name="guestCompanyName" placeholder="Company name (optional)" className={inputClass} />
              <input name="guestGstNumber" placeholder="GST number (optional)" className={inputClass} />
              <input name="guestCity" placeholder="City (optional)" className={inputClass} />
            </div>
          </div>
        )}

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
              <option value="pieces">Pieces / Units</option>
              <option value="kg">Kilograms</option>
              <option value="tons">Tons</option>
              <option value="liters">Liters</option>
              <option value="boxes">Boxes</option>
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
              <option value="7">Within 7 Days</option>
              <option value="15">Within 15 Days</option>
              <option value="30">Within 30 Days</option>
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Preferred delivery mode</div>
            <select name="deliveryMode" className={selectClass} defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option value="DAP">Door Delivery (DAP)</option>
              <option value="EXW">Ex-Works Pickup</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Preferred payment terms</div>
          <select name="paymentTerms" className={selectClass} defaultValue="">
            <option value="" disabled>
              Select
            </option>
            <option value="credit30">30 Days Credit</option>
            <option value="full_on_delivery">100% on Delivery</option>
            <option value="advance_balance">Advance + Balance</option>
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