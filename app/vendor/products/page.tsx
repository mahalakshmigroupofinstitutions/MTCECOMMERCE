import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { Placeholder, buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorProducts } from "@/lib/vendor";
import { deleteVendorProductAction } from "@/app/vendor/actions";

export const revalidate = 0;

export default async function VendorProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor/products");

  const products = await getVendorProducts(supplierId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-ink">My Products</h1>
        <Link href="/vendor/products/new" className={buttonClassName({ size: "sm" })}>
          <Icon name="plus" size={16} strokeWidth={2} /> Add product
        </Link>
      </div>

      {error === "delete" && (
        <p className="mb-4 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Couldn&rsquo;t delete that product — it already has RFQs or orders attached.
        </p>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center text-sm text-sub">
          No products listed yet.
          <Link href="/vendor/products/new" className="mt-3 block font-bold text-ink underline">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-line p-2.5">
              <Placeholder label={p.title} height={110} />
              <div className="text-[12.5px] leading-tight font-bold text-ink">{p.title}</div>
              <div className="font-mono text-sm font-extrabold text-ink">
                ₹{p.price.toLocaleString("en-IN")}
                <span className="text-[10px] font-semibold text-sub">/{p.unit}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/vendor/products/${p.id}/edit`}
                  className={buttonClassName({ variant: "outline", size: "sm", full: true })}
                >
                  Edit
                </Link>
                <form action={deleteVendorProductAction} className="flex-1">
                  <input type="hidden" name="productId" value={p.id} />
                  <SubmitButton
                    pendingText="Deleting…"
                    className={buttonClassName({ variant: "outline", size: "sm", full: true })}
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
