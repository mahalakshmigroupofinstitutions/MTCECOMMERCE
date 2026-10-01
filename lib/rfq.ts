import { prisma } from "@/lib/prisma";
import type { RfqStatus } from "@/lib/generated/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import { publicProductWithSupplierWhere } from "@/lib/publicVisibility";
import { parseLeadingNumber } from "@/lib/rfqForm";

/** Expected, user-facing failures of the buyer's quote actions. Anything else
 * thrown out of acceptQuote/rejectQuote is a genuine server error. */
export type QuoteActionErrorCode = "notFound" | "notPending" | "rfqClosed";

export class QuoteActionError extends Error {
  constructor(readonly code: QuoteActionErrorCode) {
    super(`Quote action failed: ${code}`);
    this.name = "QuoteActionError";
  }
}

type Db = typeof prisma | Prisma.TransactionClient;

/** Human-readable id for a Quote, e.g. "QTE-2026-000042". Same DocumentCounter
 * pattern as Invoice.invoiceNumber (see lib/orders.ts) — one counter per
 * (docType, year), bumped atomically so concurrent creations never collide.
 * Takes `db` so callers can generate one inside their own transaction. */
async function generateQuoteNumber(db: Db): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await db.documentCounter.upsert({
    where: { docType_year: { docType: "QUOTE", year } },
    create: { docType: "QUOTE", year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `QTE-${year}-${String(counter.lastNumber).padStart(6, "0")}`;
}

export interface CreateRfqInput {
  buyerId: string;
  productId?: string;
  categoryId?: string;
  quantity: string;
  uom?: string;
  notes?: string;
  targetPrice?: string;
  concession?: string;
  deliveryTimeline?: string;
  deliveryMode?: string;
  paymentTerms?: string;
  specSheetUrl?: string;
  targetDeliveryDate?: Date;
  submissionDeadline?: Date;
  status?: RfqStatus;
}

export async function createRfq(input: CreateRfqInput) {
  return prisma.rFQ.create({ data: input });
}

/** Server-side check of the product/category an RFQ form posted. A product
 * must be publicly listed (same rule the catalog uses) and then decides the
 * category itself — a client-supplied categoryId is never trusted alongside
 * it. Returns null when either id doesn't resolve. */
export async function resolveRfqTarget(input: {
  productId?: string;
  categoryId?: string;
}): Promise<{ productId?: string; categoryId?: string } | null> {
  if (input.productId) {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, ...publicProductWithSupplierWhere },
      select: { id: true, categoryId: true },
    });
    return product ? { productId: product.id, categoryId: product.categoryId } : null;
  }
  if (input.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    return category ? { categoryId: category.id } : null;
  }
  return {};
}

export async function getRfqsForBuyer(buyerId: string) {
  return prisma.rFQ.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: { product: true, category: true, quotes: true },
  });
}

export type RfqSummary = Awaited<ReturnType<typeof getRfqsForBuyer>>[number];

const rfqWithQuotesInclude = {
  buyer: true,
  product: true,
  category: true,
  quotes: { include: { supplier: true }, orderBy: { price: "asc" } },
  orders: true,
} satisfies Prisma.RFQInclude;

export async function getRfqWithQuotes(id: string) {
  return prisma.rFQ.findUnique({ where: { id }, include: rfqWithQuotesInclude });
}

/** The buyer-facing read: null unless the RFQ belongs to `buyerId`, so a
 * guessed or shared id never reveals another buyer's RFQ or its quotes. */
export async function getRfqWithQuotesForBuyer(id: string, buyerId: string) {
  return prisma.rFQ.findFirst({ where: { id, buyerId }, include: rfqWithQuotesInclude });
}

export type RfqWithQuotes = NonNullable<Awaited<ReturnType<typeof getRfqWithQuotes>>>;

/** Most recent quotes received across all of a buyer's RFQs, for the
 * dashboard's "Recent Quotes" section. Unlike getRfqWithQuotes, this isn't
 * scoped to one RFQ — it's quotes-first, ordered by when the supplier quoted,
 * not by which requirement they belong to. Quote has no buyerId of its own,
 * so this joins through rfq.buyerId (PRODUCT-sourced quotes have no rfq and
 * are correctly excluded). */
export async function getRecentQuotesForBuyer(buyerId: string, limit = 5) {
  return prisma.quote.findMany({
    where: { rfq: { buyerId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { supplier: true, rfq: { include: { product: true, category: true } } },
  });
}

export type RecentBuyerQuote = Awaited<ReturnType<typeof getRecentQuotesForBuyer>>[number];

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
  return prisma.$transaction(async (tx) => {
    const rfq = await tx.rFQ.findUniqueOrThrow({ where: { id: input.rfqId } });
    const quoteNumber = await generateQuoteNumber(tx);
    const quote = await tx.quote.create({
      data: { ...input, source: "RFQ", verified: true, quoteNumber },
    });
    if (rfq.status === "OPEN") {
      await tx.rFQ.update({ where: { id: input.rfqId }, data: { status: "QUOTED" } });
    }
    return quote;
  });
}

export interface CreateQuoteFromProductInput {
  productId: string;
  supplierId: string;
  price: number;
  unit: string;
  moq?: string;
  delivery?: string;
  payment?: string;
  validUntil?: Date;
  note?: string;
}

/** Created once a vendor confirms a product's Quotation Verification review
 * (see ProductForm's create-mode review step) — so it's already verified: true
 * by the time this runs; there's no separate post-hoc confirm step for new
 * quotes anymore. Takes `db` so the caller can create it inside the same
 * transaction as the Product row. */
export async function createQuoteFromProduct(input: CreateQuoteFromProductInput, db: Db = prisma) {
  const quoteNumber = await generateQuoteNumber(db);
  return db.quote.create({
    data: { ...input, source: "PRODUCT", verified: true, quoteNumber },
  });
}

/** Vendor confirms an auto-generated quote's price/terms, optionally editing them
 * first. Only meaningful for PRODUCT-sourced quotes; RFQ-sourced ones are already
 * verified: true at creation. */
export async function verifyQuote(
  quoteId: string,
  updates?: Partial<Pick<CreateQuoteFromProductInput, "price" | "unit" | "moq" | "delivery" | "payment" | "validUntil" | "note">>
) {
  return prisma.quote.update({
    where: { id: quoteId },
    data: { ...updates, verified: true },
  });
}

// Moved to lib/rfqForm.ts (pure, shared with RFQ form validation); re-exported
// so existing importers (e.g. lib/vendorDashboard.ts) are unchanged.
export { parseLeadingNumber };

const ORDER_STEPS = [
  { key: "confirmed", label: "Order Confirmed" },
  { key: "payment", label: "Payment Received" },
  { key: "production", label: "In Production" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

/** Accepting a quote closes the RFQ (if any), auto-rejects competing pending
 * quotes on the same RFQ or product, and creates the Order (+ its 5-step
 * tracking timeline). Works for both RFQ-sourced and PRODUCT-sourced quotes —
 * a PRODUCT-sourced quote has no `rfq`, so buyerId/quantity must be supplied
 * by the caller (the buyer doing the selecting) instead of read off the RFQ. */
export async function acceptQuote(
  quoteId: string,
  productQuoteContext?: { buyerId: string; quantity: string }
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId }, include: { rfq: true } });

    if (!quote.rfq && !productQuoteContext) {
      throw new Error("acceptQuote: productQuoteContext is required for a PRODUCT-sourced quote");
    }

    const buyerId = quote.rfq ? quote.rfq.buyerId : productQuoteContext!.buyerId;
    const quantity = quote.rfq ? quote.rfq.quantity : productQuoteContext!.quantity;
    const productId = quote.rfq ? quote.rfq.productId : quote.productId;

    const qty = parseLeadingNumber(quantity);
    const total = qty !== null ? Math.round(qty * quote.price) : quote.price;

    // Claim the RFQ and the quote with conditional updates rather than a
    // read-then-write, so two concurrent accepts can't both create an order:
    // the second blocks on the row lock, then matches nothing and rolls back.
    if (quote.rfqId) {
      const closed = await tx.rFQ.updateMany({
        where: { id: quote.rfqId, status: { not: "CLOSED" } },
        data: { status: "CLOSED" },
      });
      if (closed.count === 0) throw new QuoteActionError("rfqClosed");
    }
    const accepted = await tx.quote.updateMany({
      where: { id: quoteId, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });
    if (accepted.count === 0) throw new QuoteActionError("notPending");
    await tx.quote.updateMany({
      where: {
        id: { not: quoteId },
        status: "PENDING",
        ...(quote.rfqId ? { rfqId: quote.rfqId } : { productId: quote.productId }),
      },
      data: { status: "REJECTED" },
    });

    const order = await tx.order.create({
      data: {
        rfqId: quote.rfqId,
        quoteId: quote.id,
        buyerId,
        supplierId: quote.supplierId,
        productId,
        quantity,
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

/** Only a still-pending quote can be rejected — an accepted one has already
 * become an order. */
export async function rejectQuote(quoteId: string) {
  const result = await prisma.quote.updateMany({
    where: { id: quoteId, status: "PENDING" },
    data: { status: "REJECTED" },
  });
  if (result.count === 0) throw new QuoteActionError("notPending");
}

/** Ownership gate for the buyer's accept/reject actions: the quote must belong
 * to `rfqId`, and that RFQ to `buyerId` — checking the RFQ alone would let a
 * buyer pair their own rfqId with someone else's quoteId. Ownership never
 * changes after creation, so checking it before the (atomic) state change is
 * safe. */
async function assertBuyerOwnsRfqQuote(buyerId: string, rfqId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, rfqId, rfq: { buyerId } },
    select: { id: true },
  });
  if (!quote) throw new QuoteActionError("notFound");
}

export async function acceptRfqQuoteForBuyer(buyerId: string, rfqId: string, quoteId: string) {
  await assertBuyerOwnsRfqQuote(buyerId, rfqId, quoteId);
  return acceptQuote(quoteId);
}

export async function rejectRfqQuoteForBuyer(buyerId: string, rfqId: string, quoteId: string) {
  await assertBuyerOwnsRfqQuote(buyerId, rfqId, quoteId);
  return rejectQuote(quoteId);
}
