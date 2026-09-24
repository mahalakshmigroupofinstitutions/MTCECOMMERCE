import Link from "next/link";
import { redirect } from "next/navigation";
import { SupplierCard } from "@/components/catalog/SupplierCard";
import { SubmitButton, buttonClassName } from "@/components/ui";
import { getCurrentBuyerId } from "@/lib/session";
import { getSavedSuppliers } from "@/lib/account";
import { toggleSaveSupplierAction } from "@/app/(buyer)/account/actions";

export const revalidate = 0;

/* Dedicated saved-suppliers page — reuses the same data (getSavedSuppliers)
 * and the same toggle action the supplier page's Save button already uses,
 * so unsaving here is the exact same operation, not a second implementation
 * of it. SupplierCard itself is left untouched (it's used elsewhere too);
 * the Remove control sits alongside it rather than inside its <Link>, since
 * a form can't nest inside an anchor. */
export default async function SavedSuppliersPage() {
  const buyerId = await getCurrentBuyerId();

  if (!buyerId) {
    redirect(`/login?next=${encodeURIComponent("/saved-suppliers")}`);
  }

  const savedSuppliers = await getSavedSuppliers(buyerId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <h1 className="mb-5 text-lg font-extrabold text-ink">Saved suppliers</h1>

      {savedSuppliers.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center">
          <p className="text-sm text-sub">No saved suppliers yet.</p>
          <Link href="/search" className="mt-3 inline-block text-[13px] font-bold text-ink underline">
            Browse suppliers
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4">
          {savedSuppliers.map((s) => (
            <div key={s.id} className="flex flex-shrink-0 flex-col gap-2 sm:flex-shrink">
              <SupplierCard supplier={s} />
              <form action={toggleSaveSupplierAction}>
                <input type="hidden" name="supplierId" value={s.id} />
                <input type="hidden" name="supplierSlug" value={s.slug} />
                <input type="hidden" name="backTo" value="/saved-suppliers" />
                <SubmitButton
                  pendingText="Removing…"
                  className={buttonClassName({ variant: "outline", size: "sm", full: true })}
                >
                  Remove
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
