import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorRfqById } from "@/lib/vendor";
import { submitVendorQuote } from "@/app/vendor/actions";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

const QUOTE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting the buyer's decision",
  ACCEPTED: "Won — the buyer accepted this quote",
  REJECTED: "Not selected by the buyer",
};

export default async function VendorRfqDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect(`/vendor/login?next=/vendor/rfqs/${id}`);

  const rfq = await getVendorRfqById(id, supplierId);
  if (!rfq) notFound();

  const myQuote = rfq.quotes[0];

  return (
    <div className="mx-auto max-w-2xl px-6 py-6 md:py-8">
      <div className="mb-1 text-[12.5px] text-sub">
        <Link href="/vendor/rfqs">RFQ inbox</Link>
      </div>
      <h1 className="text-lg font-extrabold text-ink">
        {rfq.product?.title ?? rfq.category?.name ?? "General requirement"}
      </h1>
      <div className="mt-2 text-[13px] text-sub">
        From <b className="text-ink">{rfq.buyer.companyName ?? rfq.buyer.name ?? "a buyer"}</b>
        {rfq.buyer.city && <> &middot; {rfq.buyer.city}</>}
      </div>
      <div className="mt-2 text-[13px] text-sub">
        Qty <b className="text-ink">{rfq.quantity}</b>
        {rfq.targetDeliveryDate && (
          <>
            {" "}
            &middot; Needed by{" "}
            <b className="text-ink">
              {rfq.targetDeliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </b>
          </>
        )}
      </div>
      {rfq.notes && <p className="mt-2 text-[13.5px] text-sub">{rfq.notes}</p>}

      <div className="mt-7">
        {myQuote ? (
          <div className="rounded-2xl border border-line p-5">
            <div className="font-extrabold text-ink">Your quote</div>
            <div className="mt-1 text-[13px] text-sub">{QUOTE_STATUS_LABEL[myQuote.status] ?? myQuote.status}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="font-mono text-[15px] font-extrabold text-ink">
                  ₹{myQuote.price.toLocaleString("en-IN")}
                  <span className="text-[10px] font-semibold text-sub">/{myQuote.unit}</span>
                </div>
                <div className="text-[10.5px] text-sub">Price</div>
              </div>
              {myQuote.moq && (
                <div>
                  <div className="text-[13px] font-bold text-ink">{myQuote.moq}</div>
                  <div className="text-[10.5px] text-sub">MOQ</div>
                </div>
              )}
              {myQuote.delivery && (
                <div>
                  <div className="text-[13px] font-bold text-ink">{myQuote.delivery}</div>
                  <div className="text-[10.5px] text-sub">Delivery</div>
                </div>
              )}
              {myQuote.payment && (
                <div>
                  <div className="text-[13px] font-bold text-ink">{myQuote.payment}</div>
                  <div className="text-[10.5px] text-sub">Payment</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line p-5">
            <h2 className="mb-4 text-[15px] font-extrabold text-ink">Submit a quote</h2>
            {error && (
              <p className="mb-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
                Please enter a price.
              </p>
            )}
            <form action={submitVendorQuote} className="flex flex-col gap-3">
              <input type="hidden" name="rfqId" value={rfq.id} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="mb-1.5 text-[12.5px] font-bold text-ink">Price</div>
                  <input name="price" type="number" required min="0" className={inputClass} />
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 text-[12.5px] font-bold text-ink">Unit</div>
                  <input name="unit" defaultValue={rfq.product?.unit ?? ""} placeholder="ton" className={inputClass} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[12.5px] font-bold text-ink">MOQ</div>
                <input name="moq" placeholder="e.g. 10 tons" className={inputClass} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="mb-1.5 text-[12.5px] font-bold text-ink">Delivery estimate</div>
                  <input name="delivery" placeholder="e.g. 4–5 days" className={inputClass} />
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 text-[12.5px] font-bold text-ink">Payment terms</div>
                  <input name="payment" placeholder="e.g. 30% advance" className={inputClass} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[12.5px] font-bold text-ink">Valid until (optional)</div>
                <input type="date" name="validUntil" className={inputClass} />
              </div>
              <div>
                <div className="mb-1.5 text-[12.5px] font-bold text-ink">Note (optional)</div>
                <input name="note" placeholder="e.g. Mill TC included · transport extra" className={inputClass} />
              </div>
              <SubmitButton pendingText="Submitting…" className={buttonClassName({ full: true, size: "lg" })}>
                Submit quote
              </SubmitButton>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
