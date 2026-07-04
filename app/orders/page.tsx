import Link from "next/link";
import { IdentifyForm } from "@/components/rfq/IdentifyForm";
import { getCurrentBuyerId } from "@/lib/session";
import { getOrdersForBuyer } from "@/lib/orders";

export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PAYMENT_RECEIVED: "Payment received",
  IN_PRODUCTION: "In production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

export default async function OrdersListPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const buyerId = await getCurrentBuyerId();

  if (!buyerId) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <IdentifyForm next="/orders" error={error === "identify"} />
      </div>
    );
  }

  const orders = await getOrdersForBuyer(buyerId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <h1 className="mb-5 text-lg font-extrabold text-ink">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center">
          <p className="text-sm text-sub">No orders yet — accept a quote from one of your RFQs to place one.</p>
          <Link href="/rfq" className="mt-3 inline-block text-[13px] font-bold text-ink underline">
            View my RFQs
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{o.product?.title ?? "Order"}</div>
                <div className="mt-1 text-[12.5px] text-sub">
                  {o.supplier.name} &middot; Qty {o.quantity} &middot;{" "}
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
