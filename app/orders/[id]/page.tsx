import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { SupplierMiniCard } from "@/components/catalog/SupplierMiniCard";
import { getCurrentBuyerId } from "@/lib/session";
import { getOrderById } from "@/lib/orders";
import { advanceOrderAction } from "@/app/orders/actions";

export const revalidate = 0;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, buyerId] = await Promise.all([getOrderById(id), getCurrentBuyerId()]);
  if (!order) notFound();

  const isOwner = buyerId === order.buyerId;
  const isDelivered = order.status === "DELIVERED";

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <div className="mb-1 text-[12.5px] text-sub">
        <Link href="/orders">My Orders</Link>
      </div>
      <h1 className="text-lg font-extrabold text-ink">{order.product?.title ?? "Order"}</h1>
      <div className="mt-2 text-[13px] text-sub">
        Order <span className="font-mono text-ink">#{order.id.slice(-8).toUpperCase()}</span> &middot; Qty{" "}
        <b className="text-ink">{order.quantity}</b> &middot; Placed{" "}
        {order.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </div>
      <div className="mt-3 font-mono text-2xl font-extrabold text-ink">₹{order.total.toLocaleString("en-IN")}</div>

      {isDelivered && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-ink p-4 font-extrabold text-white">
          <Icon name="check" size={16} strokeWidth={2.4} /> Delivered
        </div>
      )}

      <div className="mt-7">
        <h2 className="mb-4 text-base font-extrabold text-ink">Tracking</h2>
        <OrderTimeline steps={order.steps} />
      </div>

      {isOwner && !isDelivered && (
        <div className="mt-2 rounded-2xl border border-line p-4">
          <p className="text-[12px] text-sub">
            <b className="text-ink">Internal control, not for production.</b> Stands in for Razorpay&rsquo;s payment
            webhook and a logistics integration until those exist.
          </p>
          <form action={advanceOrderAction} className="mt-3">
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className={buttonClassName({ variant: "outline", size: "sm" })}>
              Advance to next step
            </button>
          </form>
        </div>
      )}

      <div className="mt-7">
        <h2 className="mb-3 text-base font-extrabold text-ink">Supplier</h2>
        <SupplierMiniCard supplier={order.supplier} />
      </div>
    </div>
  );
}
