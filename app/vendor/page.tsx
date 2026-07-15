import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { Metric, VerifiedBadge } from "@/components/ui";
import { getCurrentSupplierId, getCurrentVendor } from "@/lib/vendorSession";
import { getVendorRfqs, getVendorProducts, getVendorOrders } from "@/lib/vendor";

export const revalidate = 0;

export default async function VendorDashboardPage() {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor");

  const [vendor, rfqs, products, orders] = await Promise.all([
    getCurrentVendor(),
    getVendorRfqs(supplierId),
    getVendorProducts(supplierId),
    getVendorOrders(supplierId),
  ]);
  if (!vendor) redirect("/vendor/login?next=/vendor");

  const notYetQuoted = rfqs.filter((r) => r.quotes.length === 0).length;
  const pendingQuotes = rfqs.filter((r) => r.quotes.some((q) => q.status === "PENDING")).length;
  const activeOrders = orders.filter((o) => o.status !== "DELIVERED").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-xl font-extrabold text-ink">{vendor.name}</h1>
        <VerifiedBadge show={vendor.verified} small />
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-sub">
        <Icon name="pin" size={13} />
        {vendor.city}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="star" value={vendor.trustScore.toFixed(1)} label="Trust score" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="doc" value={String(notYetQuoted)} label="RFQs to quote" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="clock" value={String(pendingQuotes)} label="Quotes pending" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="box" value={String(activeOrders)} label="Active orders" />
        </div>
      </div>

      {products.length === 0 && (
        <div className="mt-7 rounded-2xl border border-line bg-wash p-5">
          <p className="text-[13.5px] font-bold text-ink">Add your first product to start receiving RFQs</p>
          <p className="mt-1 text-[12.5px] text-sub">
            Buyers can only send you requests for quotes on products you&rsquo;ve listed.
          </p>
          <Link href="/vendor/products/new" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink underline">
            <Icon name="plus" size={14} strokeWidth={2} /> Add a product
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/vendor/rfqs" className="rounded-2xl border border-line p-5">
          <Icon name="doc" size={22} />
          <div className="mt-3 font-extrabold text-ink">RFQ inbox</div>
          <div className="mt-1 text-[12.5px] text-sub">See and respond to buyer requests</div>
        </Link>
        <Link href="/vendor/products" className="rounded-2xl border border-line p-5">
          <Icon name="box" size={22} />
          <div className="mt-3 font-extrabold text-ink">Products</div>
          <div className="mt-1 text-[12.5px] text-sub">Manage your catalog</div>
        </Link>
        <Link href="/vendor/orders" className="rounded-2xl border border-line p-5">
          <Icon name="truck" size={22} />
          <div className="mt-3 font-extrabold text-ink">Orders</div>
          <div className="mt-1 text-[12.5px] text-sub">Track fulfillment</div>
        </Link>
      </div>
    </div>
  );
}
