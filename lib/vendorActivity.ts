/* Recent activity — derived from existing rows (Product, RFQ, Quote, OrderStep
 * timestamps), not stored separately. A stored activity log would need a write
 * on every mutation path and would silently drift the first time one is
 * missed; deriving it means it can't drift and needs no migration. */
import "server-only";
import { prisma } from "@/lib/prisma";
import { getVendorRfqScope } from "@/lib/vendorDashboard";

export type VendorActivityType =
  | "product_added"
  | "product_updated"
  | "quote_submitted"
  | "quote_accepted"
  | "quote_rejected"
  | "order_advanced"
  | "rfq_received";

export interface VendorActivityItem {
  key: string;
  type: VendorActivityType;
  title: string;
  at: Date;
  href: string;
}

const PER_SOURCE_LIMIT = 8;

export async function getVendorActivity(supplierId: string, limit = 10): Promise<VendorActivityItem[]> {
  const rfqScope = await getVendorRfqScope(supplierId);

  const [products, quotes, orderSteps, rfqs] = await Promise.all([
    prisma.product.findMany({
      where: { supplierId },
      orderBy: { updatedAt: "desc" },
      take: PER_SOURCE_LIMIT,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    }),
    prisma.quote.findMany({
      where: { supplierId },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE_LIMIT,
      select: { id: true, rfqId: true, createdAt: true, status: true },
    }),
    prisma.orderStep.findMany({
      where: { done: true, at: { not: null }, order: { supplierId } },
      orderBy: { at: "desc" },
      take: PER_SOURCE_LIMIT,
      select: { id: true, label: true, at: true, orderId: true },
    }),
    rfqScope
      ? prisma.rFQ.findMany({
          where: rfqScope,
          orderBy: { createdAt: "desc" },
          take: PER_SOURCE_LIMIT,
          select: { id: true, createdAt: true, product: { select: { title: true } }, category: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const items: VendorActivityItem[] = [];

  for (const p of products) {
    const isNew = p.createdAt.getTime() === p.updatedAt.getTime();
    items.push({
      key: `product-${p.id}-${p.updatedAt.toISOString()}`,
      type: isNew ? "product_added" : "product_updated",
      title: isNew ? `Added product "${p.title}"` : `Updated product "${p.title}"`,
      at: p.updatedAt,
      href: `/vendor/products/${p.id}`,
    });
  }

  for (const q of quotes) {
    const type = q.status === "ACCEPTED" ? "quote_accepted" : q.status === "REJECTED" ? "quote_rejected" : "quote_submitted";
    items.push({
      key: `quote-${q.id}`,
      type,
      title: q.status === "ACCEPTED" ? "Quote accepted by buyer" : q.status === "REJECTED" ? "Quote rejected by buyer" : "Submitted a quote",
      at: q.createdAt,
      href: `/vendor/rfqs/${q.rfqId}`,
    });
  }

  for (const s of orderSteps) {
    if (!s.at) continue;
    items.push({
      key: `order-step-${s.id}`,
      type: "order_advanced",
      title: `Order ${s.label.toLowerCase()}`,
      at: s.at,
      href: `/vendor/orders/${s.orderId}`,
    });
  }

  for (const r of rfqs) {
    items.push({
      key: `rfq-${r.id}`,
      type: "rfq_received",
      title: `New RFQ received${r.product ? ` for "${r.product.title}"` : r.category ? ` in ${r.category.name}` : ""}`,
      at: r.createdAt,
      href: `/vendor/rfqs/${r.id}`,
    });
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
