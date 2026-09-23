import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorUnverifiedQuotes } from "@/lib/vendor";
import { verifyQuoteAction } from "@/app/vendor/actions";

export const revalidate = 0;

/** Queue of auto-generated (unverified) product quotes waiting for the vendor
 * to confirm price/terms before a buyer can see them. */
export default async function VendorQuotesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor/quotes");

  const quotes = await getVendorUnverifiedQuotes(supplierId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <h1 className="mb-1 text-lg font-extrabold text-ink">Quotes to verify</h1>
      <p className="mb-5 text-[12.5px] text-sub">
        Every new product gets a draft quote automatically. Confirm price and terms before buyers can see it.
      </p>

      {error && (
        <p className="mb-4 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Couldn&rsquo;t verify that quote. Please try again.
        </p>
      )}

      {quotes.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center text-sm text-sub">
          Nothing waiting on you right now.
          <Link href="/vendor/products" className="mt-3 block font-bold text-ink underline">
            View your products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => (
            <form
              key={quote.id}
              action={verifyQuoteAction}
              className="rounded-2xl border border-line p-4"
            >
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
      )}
    </div>
  );
}
