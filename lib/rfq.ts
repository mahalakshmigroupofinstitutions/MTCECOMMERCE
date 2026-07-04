import { prisma } from "@/lib/prisma";

export interface CreateRfqInput {
  buyerId: string;
  productId?: string;
  categoryId?: string;
  quantity: string;
  notes?: string;
  targetDeliveryDate?: Date;
}

export async function createRfq(input: CreateRfqInput) {
  return prisma.rFQ.create({ data: input });
}

export async function getRfqsForBuyer(buyerId: string) {
  return prisma.rFQ.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: { product: true, category: true, quotes: true },
  });
}

export type RfqSummary = Awaited<ReturnType<typeof getRfqsForBuyer>>[number];

export async function getRfqWithQuotes(id: string) {
  return prisma.rFQ.findUnique({
    where: { id },
    include: {
      buyer: true,
      product: true,
      category: true,
      quotes: { include: { supplier: true }, orderBy: { price: "asc" } },
      orders: true,
    },
  });
}

export type RfqWithQuotes = NonNullable<Awaited<ReturnType<typeof getRfqWithQuotes>>>;

export interface CreateQuoteInput {
  rfqId: string;
  supplierId: string;
  price: number;
  unit: string;
  moq?: string;
  delivery?: string;
  payment?: string;
  validUntil?: Date;
  note?: string;
  best?: boolean;
}

export async function createQuote(input: CreateQuoteInput) {
  const rfq = await prisma.rFQ.findUniqueOrThrow({ where: { id: input.rfqId } });
  const quote = await prisma.quote.create({ data: input });
  if (rfq.status === "OPEN") {
    await prisma.rFQ.update({ where: { id: input.rfqId }, data: { status: "QUOTED" } });
  }
  return quote;
}

/** Best-effort: pulls the leading number out of a free-text quantity like "25 tons". */
function parseLeadingNumber(text: string): number | null {
  const match = text.match(/[\d,]+(\.\d+)?/);
  if (!match) return null;
  const n = parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

const ORDER_STEPS = [
  { key: "confirmed", label: "Order Confirmed" },
  { key: "payment", label: "Payment Received" },
  { key: "production", label: "In Production" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

/** Accepting a quote closes the RFQ, auto-rejects competing pending quotes, and
 * creates the Order (+ its 5-step tracking timeline) that Phase 5 builds a real UI for. */
export async function acceptQuote(quoteId: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { rfq: true } });

    const qty = parseLeadingNumber(quote.rfq.quantity);
    const total = qty !== null ? Math.round(qty * quote.price) : quote.price;

    await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } });
    await tx.quote.updateMany({
      where: { rfqId: quote.rfqId, id: { not: quoteId }, status: "PENDING" },
      data: { status: "REJECTED" },
    });
    await tx.rFQ.update({ where: { id: quote.rfqId }, data: { status: "CLOSED" } });

    const order = await tx.order.create({
      data: {
        rfqId: quote.rfqId,
        quoteId: quote.id,
        buyerId: quote.rfq.buyerId,
        supplierId: quote.supplierId,
        productId: quote.rfq.productId,
        quantity: quote.rfq.quantity,
        total,
        status: "CONFIRMED",
        paymentStatus: "PENDING",
      },
    });

    await tx.orderStep.createMany({
      data: ORDER_STEPS.map((step, i) => ({
        orderId: order.id,
        key: step.key,
        label: step.label,
        position: i,
        done: i === 0,
        active: i === 1,
        at: i === 0 ? new Date() : null,
      })),
    });

    return order;
  });
}

export async function rejectQuote(quoteId: string) {
  return prisma.quote.update({ where: { id: quoteId }, data: { status: "REJECTED" } });
}
