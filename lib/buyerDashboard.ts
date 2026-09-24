/* Buyer dashboard data — counts and a short "needs attention" batch only,
 * mirroring lib/vendorDashboard.ts's approach (never load every row just to
 * derive a handful of numbers). Everything else the dashboard shows (recent
 * RFQs/orders/saved suppliers, recent quotes) is already served by existing
 * functions in lib/rfq.ts, lib/orders.ts and lib/account.ts — this file only
 * adds what those don't already provide.
 *
 * Buyer has no direct relation to Quote — a Quote belongs to a Supplier and,
 * when RFQ-sourced, to an RFQ. "The buyer's quotes" therefore means
 * Quote.rfq.buyerId, joined through RFQ exactly as the schema models it. A
 * PRODUCT-sourced quote (no RFQ behind it) is a vendor-initiated draft with no
 * buyer request yet, so it's correctly excluded by that same join. */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface BuyerDashboardStats {
  rfqs: number;
  quotes: number;
  orders: number;
  savedSuppliers: number;
  invoices: number;
}

export interface BuyerAttentionItem {
  key: string;
  title: string;
  detail: string;
  href: string;
}

const ATTENTION_LIMIT = 5;
/** The order steps app/(buyer)/orders/[id]/page.tsx's own `canAdvance` check
 * already treats as the buyer's turn to act (mark payment received, confirm
 * delivery) — reused here rather than re-deciding what "actionable" means. */
const ACTIONABLE_ORDER_STEP_KEYS = ["payment", "delivered"] as const;

export interface BuyerDashboardOverview {
  stats: BuyerDashboardStats;
  attentionItems: BuyerAttentionItem[];
}

/** One parallel batch of buyer-scoped queries — counts for the stats row, plus
 * the small row sets needed to build the "needs attention" list. Every query
 * is `where: { buyerId }` (or joined through RFQ.buyerId for quotes); nothing
 * here ever scans another buyer's data. */
export async function getBuyerDashboardOverview(buyerId: string): Promise<BuyerDashboardOverview> {
  const [rfqs, quotes, orders, savedSuppliers, invoices, pendingQuotes, actionableOrders] = await Promise.all([
    prisma.rFQ.count({ where: { buyerId } }),
    prisma.quote.count({ where: { rfq: { buyerId } } }),
    prisma.order.count({ where: { buyerId } }),
    prisma.savedSupplier.count({ where: { buyerId } }),
    prisma.invoice.count({ where: { buyerId } }),
    prisma.quote.findMany({
      where: { rfq: { buyerId }, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: ATTENTION_LIMIT,
      include: { supplier: true, rfq: { include: { product: true, category: true } } },
    }),
    prisma.order.findMany({
      where: { buyerId, steps: { some: { active: true, key: { in: [...ACTIONABLE_ORDER_STEP_KEYS] } } } },
      orderBy: { createdAt: "desc" },
      take: ATTENTION_LIMIT,
      include: { product: true, steps: true },
    }),
  ]);

  const attentionItems: BuyerAttentionItem[] = [
    // A PENDING quote is one the buyer hasn't accepted or rejected yet — the
    // same status app/(buyer)/rfq/[id]/page.tsx's QuoteCard shows action
    // buttons for.
    ...pendingQuotes.map((q) => ({
      key: `quote-${q.id}`,
      title: `New quote from ${q.supplier.name}`,
      detail: `₹${q.price.toLocaleString("en-IN")}/${q.unit} for ${
        q.rfq?.product?.title ?? q.rfq?.category?.name ?? "your requirement"
      }`,
      href: q.rfqId ? `/rfq/${q.rfqId}` : "/rfq",
    })),
    ...actionableOrders.map((o) => {
      const activeKey = o.steps.find((s) => s.active)?.key;
      return {
        key: `order-${o.id}`,
        title: activeKey === "delivered" ? "Confirm delivery" : "Mark payment received",
        detail: o.product?.title ?? "Order",
        href: `/orders/${o.id}`,
      };
    }),
  ];

  return {
    stats: { rfqs, quotes, orders, savedSuppliers, invoices },
    attentionItems,
  };
}
