import { prisma } from "@/lib/prisma";

export async function getOrdersForBuyer(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: { product: true, supplier: true, invoice: true, steps: { orderBy: { position: "asc" } } },
  });
}

export type OrderSummary = Awaited<ReturnType<typeof getOrdersForBuyer>>[number];

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { product: true, supplier: true, buyer: true, invoice: true, steps: { orderBy: { position: "asc" } } },
  });
}

export type OrderWithSteps = NonNullable<Awaited<ReturnType<typeof getOrderById>>>;

const STEP_STATUS = {
  confirmed: "CONFIRMED",
  payment: "PAYMENT_RECEIVED",
  production: "IN_PRODUCTION",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
} as const;

/** Internal stopgap for advancing an order: until Razorpay webhooks (payment) and
 * logistics integrations (production/shipping) exist, an internal action marks the
 * next step complete. Real webhook handlers can call this same function later. */
export async function advanceOrderStep(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const steps = await tx.orderStep.findMany({ where: { orderId }, orderBy: { position: "asc" } });
    const current = steps.find((s) => s.active);
    if (!current) return;

    if (current.key === "payment") {
      const claimed = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: "PENDING" },
        data: { status: "PAYMENT_RECEIVED", paymentStatus: "PAID" },
      });
      if (claimed.count === 0) return;
    }

    await tx.orderStep.update({ where: { id: current.id }, data: { done: true, active: false, at: new Date() } });

    const next = steps.find((s) => s.position === current.position + 1);
    if (next) {
      await tx.orderStep.update({ where: { id: next.id }, data: { active: true } });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: STEP_STATUS[current.key as keyof typeof STEP_STATUS],
      },
    });

    if (current.key === "payment") {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { buyerId: true, supplierId: true, total: true },
      });
      if (!order) throw new Error("Order not found while creating invoice");

      const year = new Date().getFullYear();
      const counter = await tx.documentCounter.upsert({
        where: { docType_year: { docType: "INVOICE", year } },
        create: { docType: "INVOICE", year, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      });

      await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${year}-${String(counter.lastNumber).padStart(6, "0")}`,
          orderId,
          buyerId: order.buyerId,
          supplierId: order.supplierId,
          amount: order.total,
          status: "PAID",
        },
      });
    }
  });
}
