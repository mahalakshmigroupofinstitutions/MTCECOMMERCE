import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorUnverifiedQuotes, getVendorQuotes, type VendorQuote } from "@/lib/vendor";
import { verifyQuoteAction } from "@/app/vendor/actions";
import type { QuoteStatus } from "@/lib/generated/prisma/client";

export const revalidate = 0;

const STATUS_LABEL: Record<QuoteStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

const STATUS_CLASS: Record<QuoteStatus, string> = {
  PENDING: "bg-wash text-ink",
  ACCEPTED: "bg-green/15 text-green",
  REJECTED: "bg-red/15 text-red",
};

function QuoteRow({ quote }: { quote: VendorQuote }) {
  const buyerName = quote.rfq?.buyer?.name;
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-ink">
            {quote.product ? (
              <Link href={`/vendor/products/${quote.product.id}/edit`} className="hover:underline">
                {quote.product.title}
              </Link>
            ) : (
              "RFQ response"
            )}
          </div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-sub">
            {quote.quoteNumber ?? "No quotation number"} · {quote.source === "PRODUCT" ? "Product listing" : "RFQ response"}
            {buyerName ? ` · Buyer: ${buyerName}` : ""}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[quote.status]}`}>
          {STATUS_LABEL[quote.status]}
          {!quote.verified && " · unverified"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div className="text-[11px] font-semibold text-sub">Price</div>
          <div className="font-mono text-[13px] text-ink">
            ₹{quote.price} / {quote.unit}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-sub">MOQ</div>
          <div className="text-[13px] text-ink">{quote.moq ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-sub">Delivery</div>
          <div className="text-[13px] text-ink">{quote.delivery ?? "—"}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold text-sub">Payment</div>
          <div className="text-[13px] text-ink">{quote.payment ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

/** Persistent Quotations page: every quote this vendor has, of either source
 * and any status — a quote stays visible here whether it's pending, accepted
 * or rejected. Also surfaces any legacy unverified product quotes (created
 * before the Quotation Verification review step existed) so they don't get
 * stranded — new product quotes are already verified by the time they land here. */
export default async function VendorQuotesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor/quotes");

  const [unverified, quotes] = await Promise.all([
    getVendorUnverifiedQuotes(supplierId),
    getVendorQuotes(supplierId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <h1 className="mb-1 text-lg font-extrabold text-ink">Quotations</h1>
      <p className="mb-5 text-[12.5px] text-sub">Every quotation linked to your products and RFQ responses.</p>

      {error && (
        <p className="mb-4 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Couldn&rsquo;t verify that quote. Please try again.
        </p>
      )}

      {unverified.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-extrabold text-ink">Needs verification</h2>
          <div className="flex flex-col gap-3">
            {unverified.map((quote) => (
              <form key={quote.id} action={verifyQuoteAction} className="rounded-2xl border border-line p-4">
                <input type="hidden" name="quoteId" value={quote.id} />
                <div className="mb-3 font-extrabold text-ink">{quote.product?.title ?? "Product"}</div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <label className="text-[11px] font-semibold text-sub">
                    Price
                    <input
                      type="number"
                      name="price"
                      defaultValue={quote.price}
                      className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 font-mono text-[13px] text-ink"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-sub">
                    Unit
                    <input
                      type="text"
                      name="unit"
                      defaultValue={quote.unit}
                      className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-[13px] text-ink"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-sub">
                    Delivery
                    <input
                      type="text"
                      name="delivery"
                      defaultValue={quote.delivery ?? ""}
                      placeholder="e.g. 7 days"
                      className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-[13px] text-ink"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-sub">
                    Payment
                    <input
                      type="text"
                      name="payment"
                      defaultValue={quote.payment ?? ""}
                      placeholder="e.g. 50% advance"
                      className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-[13px] text-ink"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-[11px] font-semibold text-sub">
                  Note (optional)
                  <textarea
                    name="note"
                    defaultValue={quote.note ?? ""}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-[13px] text-ink"
                  />
                </label>

                <SubmitButton
                  pendingText="Confirming…"
                  className={buttonClassName({ size: "sm", full: true, className: "mt-3" })}
                >
                  Confirm quote
                </SubmitButton>
              </form>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-2 text-sm font-extrabold text-ink">All quotations</h2>
      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center text-sm text-sub">
          No quotations yet.
          <Link href="/vendor/products" className="mt-3 block font-bold text-ink underline">
            View your products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => (
            <QuoteRow key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}
