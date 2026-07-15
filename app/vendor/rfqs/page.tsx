import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorRfqs, type VendorRfq } from "@/lib/vendor";

export const revalidate = 0;

function statusFor(rfq: VendorRfq) {
  const quote = rfq.quotes[0];
  if (!quote) return { label: "Not quoted", className: "bg-wash text-ink" };
  if (quote.status === "ACCEPTED") return { label: "Won", className: "bg-ink text-white" };
  if (quote.status === "REJECTED") return { label: "Lost", className: "bg-wash text-faint" };
  return { label: "Quoted — pending", className: "bg-wash text-ink" };
}

export default async function VendorRfqInboxPage() {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor/rfqs");

  const rfqs = await getVendorRfqs(supplierId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <h1 className="mb-5 text-lg font-extrabold text-ink">RFQ inbox</h1>

      {rfqs.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center text-sm text-sub">
          No RFQs yet. They&rsquo;ll show up here once a buyer requests a quote on one of your products or categories.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((r) => {
            const status = statusFor(r);
            return (
              <Link
                key={r.id}
                href={`/vendor/rfqs/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold text-ink">
                    {r.product?.title ?? r.category?.name ?? "General requirement"}
                  </div>
                  <div className="mt-1 text-[12.5px] text-sub">
                    {r.buyer.companyName ?? r.buyer.name ?? "Buyer"} &middot; Qty {r.quantity} &middot;{" "}
                    {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold ${status.className}`}>
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
