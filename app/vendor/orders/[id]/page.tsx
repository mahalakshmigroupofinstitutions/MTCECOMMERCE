import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorOrderById } from "@/lib/vendor";
import { advanceVendorOrderStep } from "@/app/vendor/actions";

export const revalidate = 0;

export default async function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect(`/vendor/login?next=/vendor/orders/${id}`);

  const order = await getVendorOrderById(id, supplierId);
  if (!order) notFound();

  const activeKey = order.steps.find((s) => s.active)?.key;
  const canAdvance = activeKey === "production" || activeKey === "shipped";
  const isDelivered = order.status === "DELIVERED";

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <div className="mb-1 text-[12.5px] text-sub">
        <Link href="/vendor/orders">Orders</Link>
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

      {canAdvance && (
        <div className="mt-2 rounded-2xl border border-line p-4">
          <p className="text-[12px] text-sub">
            Payment confirmation and delivery confirmation are handled elsewhere — you control production and shipping.
          </p>
          <form action={advanceVendorOrderStep} className="mt-3">
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton pendingText="Advancing…" className={buttonClassName({ variant: "outline", size: "sm" })}>
              {activeKey === "production" ? "Mark production complete" : "Mark as shipped"}
            </SubmitButton>
          </form>
        </div>
      )}

      <div className="mt-7">
        <h2 className="mb-3 text-base font-extrabold text-ink">Buyer</h2>
        <div className="rounded-2xl border border-line p-4">
          <div className="font-bold text-ink">{order.buyer.companyName ?? order.buyer.name ?? "Buyer"}</div>
          {order.buyer.city && <div className="mt-1 text-[12.5px] text-sub">{order.buyer.city}</div>}
        </div>
      </div>
    </div>
  );
}
