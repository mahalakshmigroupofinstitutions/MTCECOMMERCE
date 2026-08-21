/* Vendor dashboard data — counts and aggregates only, never full-row pulls.
 * Replaces the dashboard's previous approach of loading every RFQ/product/order
 * just to derive a handful of numbers. */
import "server-only";
import { prisma } from "@/lib/prisma";
import { isApprovedVendor } from "@/lib/vendor";
import { parseLeadingNumber } from "@/lib/rfq";
import type { Prisma } from "@/lib/generated/prisma/client";

/** RFQs are relevant to a vendor if they target one of the vendor's products or
 * one of the categories the vendor sells in — mirrors the relevance rule in
 * getVendorRfqs (lib/vendor.ts). Unapproved vendors get no scope: they must not
 * learn how much buyer demand exists before they're verified. */
export async function getVendorRfqScope(supplierId: string): Promise<Prisma.RFQWhereInput | null> {
  if (!(await isApprovedVendor(supplierId))) return null;

  const myProducts = await prisma.product.findMany({
    where: { supplierId },
    select: { id: true, categoryId: true },
  });
  const productIds = myProducts.map((p) => p.id);
  const categoryIds = [...new Set(myProducts.map((p) => p.categoryId))];
  if (productIds.length === 0 && categoryIds.length === 0) return null;

  return {
    OR: [
      ...(productIds.length ? [{ productId: { in: productIds } }] : []),
      ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
    ],
  };
}

export interface VendorDashboardStats {
  rfqs: { total: number; newToday: number };
  quotes: { pending: number; expiring: number };
  orders: { active: number; processing: number; shipped: number };
  trust: { score: number; reviews: number; verified: boolean };
}

export async function getVendorDashboardStats(supplierId: string): Promise<VendorDashboardStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const in48h = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [supplier, rfqScope] = await Promise.all([
    prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { trustScore: true, reviewsCount: true, verified: true },
    }),
    getVendorRfqScope(supplierId),
  ]);

  const [rfqTotal, rfqNewToday, pendingQuotes, expiringQuotes, ordersByStatus] = await Promise.all([
    rfqScope ? prisma.rFQ.count({ where: rfqScope }) : Promise.resolve(0),
    rfqScope ? prisma.rFQ.count({ where: { ...rfqScope, createdAt: { gte: startOfDay } } }) : Promise.resolve(0),
    prisma.quote.count({ where: { supplierId, status: "PENDING" } }),
    prisma.quote.count({
      where: { supplierId, status: "PENDING", validUntil: { not: null, lte: in48h } },
    }),
    prisma.order.groupBy({ by: ["status"], where: { supplierId }, _count: { _all: true } }),
  ]);

  const countFor = (status: string) => ordersByStatus.find((o) => o.status === status)?._count._all ?? 0;
  const processing = countFor("CONFIRMED") + countFor("PAYMENT_RECEIVED") + countFor("IN_PRODUCTION");
  const shipped = countFor("SHIPPED");

  return {
    rfqs: { total: rfqTotal, newToday: rfqNewToday },
    quotes: { pending: pendingQuotes, expiring: expiringQuotes },
    orders: { active: processing + shipped, processing, shipped },
    trust: {
      score: supplier?.trustScore ?? 0,
      reviews: supplier?.reviewsCount ?? 0,
      verified: supplier?.verified ?? false,
    },
  };
}

export interface DealPipelineStage {
  key: string;
  label: string;
  count: number;
  value: number;
  href: string;
}

/** Deal pipeline: how far demand has moved toward money, not just how much
 * demand arrived. The transactional angle that replaces a plain lead count. */
export async function getDealPipeline(supplierId: string): Promise<DealPipelineStage[]> {
  const rfqScope = await getVendorRfqScope(supplierId);

  const [rfqsOpen, quotes, ordersByStatus] = await Promise.all([
    rfqScope ? prisma.rFQ.count({ where: { ...rfqScope, status: "OPEN" } }) : Promise.resolve(0),
    prisma.quote.findMany({
      where: { supplierId },
      select: { price: true, status: true, rfq: { select: { quantity: true } } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { supplierId },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  // Quote.price is a per-unit rate (see acceptQuote in lib/rfq.ts, which
  // computes an order's total the same way) — the RFQ's quantity has to be
  // parsed and multiplied in to get an actual rupee value, never summed raw.
  const quoteTotal = (q: (typeof quotes)[number]) => {
    const qty = parseLeadingNumber(q.rfq.quantity);
    return qty !== null ? Math.round(qty * q.price) : q.price;
  };
  const accepted = quotes.filter((q) => q.status === "ACCEPTED");

  const orderStage = (status: string) => {
    const row = ordersByStatus.find((o) => o.status === status);
    return { count: row?._count._all ?? 0, value: row?._sum.total ?? 0 };
  };
  const paid = orderStage("PAYMENT_RECEIVED");
  const shipped = orderStage("SHIPPED");
  const delivered = orderStage("DELIVERED");

  return [
    { key: "rfqs", label: "RFQs open", count: rfqsOpen, value: 0, href: "/vendor/rfqs" },
    { key: "quotes", label: "Quotes sent", count: quotes.length, value: quotes.reduce((sum, q) => sum + quoteTotal(q), 0), href: "/vendor/rfqs" },
    { key: "accepted", label: "Accepted", count: accepted.length, value: accepted.reduce((sum, q) => sum + quoteTotal(q), 0), href: "/vendor/orders" },
    { key: "paid", label: "Paid", count: paid.count, value: paid.value, href: "/vendor/orders" },
    { key: "shipped", label: "Shipped", count: shipped.count, value: shipped.value, href: "/vendor/orders" },
    { key: "delivered", label: "Delivered", count: delivered.count, value: delivered.value, href: "/vendor/orders" },
  ];
}

export interface ActionItem {
  key: string;
  title: string;
  detail: string;
  href: string;
}

const LOW_STOCK_THRESHOLD = 10;

/** The things actually blocking the vendor's money right now, each one tap
 * from resolution. Replaces the spec's static Quick Actions list with
 * something that reduces clicks the way the spec's own stated goal asks for. */
export async function getActionQueue(supplierId: string): Promise<ActionItem[]> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const rfqScope = await getVendorRfqScope(supplierId);

  const [staleRfqs, expiringQuotes, awaitingDispatch, lowStock] = await Promise.all([
    rfqScope
      ? prisma.rFQ.count({
          where: { ...rfqScope, status: "OPEN", createdAt: { lt: dayAgo }, quotes: { none: { supplierId } } },
        })
      : Promise.resolve(0),
    prisma.quote.count({
      where: { supplierId, status: "PENDING", validUntil: { gte: now, lte: in48h } },
    }),
    prisma.order.count({ where: { supplierId, status: { in: ["CONFIRMED", "PAYMENT_RECEIVED"] } } }),
    prisma.product.count({ where: { supplierId, status: "PUBLISHED", stock: { lte: LOW_STOCK_THRESHOLD } } }),
  ]);

  const items: ActionItem[] = [];
  if (staleRfqs > 0) {
    items.push({
      key: "stale-rfqs",
      title: `${staleRfqs} RFQ${staleRfqs === 1 ? "" : "s"} waiting over 24h`,
      detail: "Buyers are waiting on a quote from you.",
      href: "/vendor/rfqs",
    });
  }
  if (expiringQuotes > 0) {
    items.push({
      key: "expiring-quotes",
      title: `${expiringQuotes} quote${expiringQuotes === 1 ? "" : "s"} expiring within 48h`,
      detail: "Follow up before these lapse.",
      href: "/vendor/rfqs",
    });
  }
  if (awaitingDispatch > 0) {
    items.push({
      key: "dispatch",
      title: `${awaitingDispatch} order${awaitingDispatch === 1 ? "" : "s"} awaiting dispatch`,
      detail: "Move these forward to keep buyers confident.",
      href: "/vendor/orders",
    });
  }
  if (lowStock > 0) {
    items.push({
      key: "low-stock",
      title: `${lowStock} product${lowStock === 1 ? "" : "s"} low on stock`,
      detail: "Update stock before buyers hit a dead end.",
      href: "/vendor/products",
    });
  }
  return items;
}

export async function hasVendorProducts(supplierId: string): Promise<boolean> {
  const count = await prisma.product.count({ where: { supplierId } });
  return count > 0;
}

export interface VendorProfileCompletion {
  percent: number;
  isComplete: boolean;
}

/** Derived from the same onboardingStatus/onboardingStep fields the onboarding
 * wizard already maintains (lib/vendorOnboarding.ts) — never asserted separately,
 * so it can't drift from what's actually saved. */
export function getVendorProfileCompletion(supplier: {
  onboardingStatus: string;
  onboardingStep: number;
}): VendorProfileCompletion {
  if (supplier.onboardingStatus === "APPROVED") return { percent: 100, isComplete: true };
  const totalSteps = 4; // ONBOARDING_STEPS.length in lib/vendorOnboarding.ts
  const percent = Math.round((Math.min(supplier.onboardingStep, totalSteps) / totalSteps) * 100);
  return { percent, isComplete: percent >= 100 };
}
