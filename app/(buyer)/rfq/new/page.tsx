import { redirect } from "next/navigation";
import { getCurrentBuyerId } from "@/lib/session";
import { getCategories, getProductBySlug } from "@/lib/catalog";
import { submitRfq } from "@/app/(buyer)/rfq/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; error?: string }>;
}) {
  const { product: productSlug, error } = await searchParams;
  const buyerId = await getCurrentBuyerId();

  const next = `/rfq/new${productSlug ? `?product=${productSlug}` : ""}`;

  if (!buyerId) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

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

      <form action={submitRfq} className="mt-5 flex flex-col gap-4">
        {product ? (
          <>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="categoryId" value={product.categoryId} />
          </>
        ) : (
          <div>
            <div className="mb-1.5 text-[12.5px] font-bold text-ink">Category</div>
            <select name="categoryId" className={inputClass} defaultValue="">
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
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Quantity</div>
          <input
            name="quantity"
            required
            placeholder={product ? `e.g. ${product.moq} ${product.moqUnit}` : "e.g. 25 tons"}
            defaultValue={product ? `${product.moq} ${product.moqUnit}` : ""}
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Requirements</div>
          <textarea
            name="notes"
            rows={3}
            placeholder="Specs, delivery location, anything suppliers should know…"
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Target delivery date (optional)</div>
          <input type="date" name="targetDeliveryDate" className={inputClass} />
        </div>

        <SubmitButton pendingText="Submitting…" className={buttonClassName({ full: true, size: "lg" })}>
          Submit RFQ
        </SubmitButton>
      </form>
    </div>
  );
}
