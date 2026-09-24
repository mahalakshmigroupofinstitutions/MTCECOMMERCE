import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName, Metric } from "@/components/ui";
import { SupplierCard } from "@/components/catalog/SupplierCard";
import { requireBuyerId } from "@/lib/buyerAccess";
import { getCurrentBuyer } from "@/lib/session";
import { getBuyerDashboardOverview } from "@/lib/buyerDashboard";
import { getRfqsForBuyer, getRecentQuotesForBuyer } from "@/lib/rfq";
import { getOrdersForBuyer } from "@/lib/orders";
import { getSavedSuppliers } from "@/lib/account";

export const revalidate = 0;

const RECENT_LIMIT = 5;
const SAVED_SUPPLIERS_LIMIT = 4;

const RFQ_STATUS_LABEL: Record<string, string> = {
  OPEN: "Awaiting quotes",
  QUOTED: "Quotes received",
  CLOSED: "Order placed",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PAYMENT_RECEIVED: "Payment received",
  IN_PRODUCTION: "In production",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

const QUOTE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting your response",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[15px] font-extrabold text-ink">{title}</h2>
      {viewAllHref && (
        <Link href={viewAllHref} className="text-[12.5px] font-bold text-sub">
          View all
        </Link>
      )}
    </div>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-line p-6 text-center text-[13px] text-sub">
      {text}
      {cta && (
        <Link href={cta.href} className="mt-3 block font-bold text-ink underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export default async function BuyerDashboardPage() {
  const buyerId = await requireBuyerId("/dashboard");

  const [buyer, overview, rfqs, recentQuotes, orders, savedSuppliers] = await Promise.all([
    getCurrentBuyer(),
    getBuyerDashboardOverview(buyerId),
    getRfqsForBuyer(buyerId),
    getRecentQuotesForBuyer(buyerId, RECENT_LIMIT),
    getOrdersForBuyer(buyerId),
    getSavedSuppliers(buyerId),
  ]);

  const { stats, attentionItems } = overview;
  const recentRfqs = rfqs.slice(0, RECENT_LIMIT);
  const recentOrders = orders.slice(0, RECENT_LIMIT);
  const recentSavedSuppliers = savedSuppliers.slice(0, SAVED_SUPPLIERS_LIMIT);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      {/* Welcome + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Welcome back, {buyer?.name ?? "there"}</h1>
          {buyer?.companyName && <p className="mt-0.5 text-[13px] font-semibold text-sub">{buyer.companyName}</p>}
          <p className="mt-1.5 text-[13px] text-sub">
            Manage your RFQs, quotes, orders and suppliers from one place.
          </p>
        </div>
        <Link href="/rfq/new" className={buttonClassName({ size: "lg" })}>
          <Icon name="plus" size={18} strokeWidth={2} /> Post an RFQ
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="doc" value={String(stats.rfqs)} label="RFQs" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="chat" value={String(stats.quotes)} label="Quotes" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="box" value={String(stats.orders)} label="Orders" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="heart" value={String(stats.savedSuppliers)} label="Saved suppliers" />
        </div>
        <div className="rounded-2xl border border-line py-3">
          <Metric icon="tag" value={String(stats.invoices)} label="Invoices" />
        </div>
      </div>

      {/* Needs Attention — only when there's real actionable data */}
      {attentionItems.length > 0 && (
        <div className="mt-8">
          <SectionHeader title="Needs attention" />
          <div className="flex flex-col gap-2">
            {attentionItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-line bg-wash px-4 py-3 transition-colors hover:bg-line/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-ink">{item.title}</div>
                  <div className="mt-0.5 truncate text-[12px] text-sub">{item.detail}</div>
                </div>
                <Icon name="chevron-right" size={16} className="shrink-0 text-faint" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent RFQs */}
      <div className="mt-8">
        <SectionHeader title="Recent RFQs" viewAllHref="/rfq" />
        {recentRfqs.length === 0 ? (
          <EmptyState text="No RFQs yet" cta={{ href: "/rfq/new", label: "Post your first RFQ" }} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentRfqs.map((r) => (
              <Link
                key={r.id}
                href={`/rfq/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line p-3.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-ink">
                    {r.product?.title ?? r.category?.name ?? "General requirement"}
                  </div>
                  <div className="mt-1 text-[12px] text-sub">
                    {r.quotes.length} {r.quotes.length === 1 ? "quote" : "quotes"} &middot;{" "}
                    {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <span className="flex-shrink-0 rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold text-ink">
                  {RFQ_STATUS_LABEL[r.status] ?? r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Quotes */}
      <div className="mt-8">
        <SectionHeader title="Recent quotes" />
        {recentQuotes.length === 0 ? (
          <EmptyState text="No quotes yet" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentQuotes.map((q) => (
              <Link
                key={q.id}
                href={q.rfqId ? `/rfq/${q.rfqId}` : "/rfq"}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line p-3.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-ink">{q.supplier.name}</div>
                  <div className="mt-1 text-[12px] text-sub">
                    ₹{q.price.toLocaleString("en-IN")}/{q.unit} for{" "}
                    {q.rfq?.product?.title ?? q.rfq?.category?.name ?? "your requirement"}
                  </div>
                </div>
                <span className="flex-shrink-0 rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold text-ink">
                  {QUOTE_STATUS_LABEL[q.status] ?? q.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <SectionHeader title="Recent orders" viewAllHref="/orders" />
        {recentOrders.length === 0 ? (
          <EmptyState text="No orders yet" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line p-3.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-ink">{o.product?.title ?? "Order"}</div>
                  <div className="mt-1 text-[12px] text-sub">
                    {o.supplier.name} &middot;{" "}
                    {o.placedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-mono text-[13px] font-extrabold text-ink">
                    ₹{o.total.toLocaleString("en-IN")}
                  </div>
                  <span className="mt-1 inline-block rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold text-ink">
                    {ORDER_STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Saved Suppliers */}
      <div className="mt-8">
        <SectionHeader title="Saved suppliers" viewAllHref="/saved-suppliers" />
        {recentSavedSuppliers.length === 0 ? (
          <EmptyState text="No saved suppliers yet" cta={{ href: "/search", label: "Browse suppliers" }} />
        ) : (
          <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-4 sm:overflow-visible">
            {recentSavedSuppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
