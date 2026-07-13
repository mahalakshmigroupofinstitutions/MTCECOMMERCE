import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getAllSuppliers } from "@/lib/catalog";
import { getRfqWithQuotes } from "@/lib/rfq";
import { submitQuote } from "@/app/rfq/actions";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export default async function NewQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const [rfq, suppliers] = await Promise.all([getRfqWithQuotes(id), getAllSuppliers()]);
  if (!rfq) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-wash p-4">
        <Icon name="shield" size={18} className="mt-0.5 flex-shrink-0 text-ink" />
        <p className="text-[12.5px] leading-relaxed text-sub">
          <b className="text-ink">Internal tool, not for production.</b> Until the Seller Dashboard phase exists,
          quotes are entered here on a supplier&rsquo;s behalf. This page has no access control.
        </p>
      </div>

      <h1 className="text-lg font-extrabold text-ink">
        Add a quote for &ldquo;{rfq.product?.title ?? rfq.category?.name ?? "this RFQ"}&rdquo;
      </h1>

      {error && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please choose a supplier and enter a price.
        </p>
      )}

      <form action={submitQuote} className="mt-5 flex flex-col gap-4">
        <input type="hidden" name="rfqId" value={rfq.id} />

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Supplier</div>
          <select name="supplierId" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Choose a supplier
            </option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

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

        <label className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <input type="checkbox" name="best" className="h-4 w-4" />
          Mark as recommended
        </label>

        <SubmitButton pendingText="Adding…" className={buttonClassName({ full: true, size: "lg" })}>
          Add quote
        </SubmitButton>
      </form>
    </div>
  );
}
