import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorOrders } from "@/lib/vendor";

export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PAYMENT_RECEIVED: "Payment received",
  IN_PRODUCTION: "In production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

export default async function VendorOrdersPage() {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor/orders");

  const orders = await getVendorOrders(supplierId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <h1 className="mb-5 text-lg font-extrabold text-ink">Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center text-sm text-sub">
          No orders yet — they&rsquo;ll appear here once a buyer accepts one of your quotes.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/vendor/orders/${o.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{o.product?.title ?? "Order"}</div>
                <div className="mt-1 text-[12.5px] text-sub">
                  {o.buyer.companyName ?? o.buyer.name ?? "Buyer"} &middot; Qty {o.quantity} &middot;{" "}
                  {o.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-[13.5px] font-extrabold text-ink">₹{o.total.toLocaleString("en-IN")}</div>
                <span className="mt-1 inline-block rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold text-ink">
                  {STATUS_LABEL[o.status] ?? o.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
