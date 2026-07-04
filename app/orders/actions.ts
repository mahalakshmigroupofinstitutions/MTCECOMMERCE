"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyerId } from "@/lib/session";
import { getOrderById, advanceOrderStep } from "@/lib/orders";

/** Internal/demo control — stands in for Razorpay's payment webhook and a
 * logistics integration until those exist. Owner-gated on the buyer session. */
export async function advanceOrderAction(formData: FormData) {
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") redirect("/orders");

  const [buyerId, order] = await Promise.all([getCurrentBuyerId(), getOrderById(orderId)]);
  if (!order || order.buyerId !== buyerId) redirect(`/orders/${orderId}`);

  await advanceOrderStep(orderId);
  redirect(`/orders/${orderId}`);
}
