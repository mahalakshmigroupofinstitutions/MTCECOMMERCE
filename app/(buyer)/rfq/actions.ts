"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyerId } from "@/lib/session";
import { createRfq, acceptQuote, rejectQuote, getRfqWithQuotes } from "@/lib/rfq";
import { str } from "@/lib/formData";

export async function submitRfq(formData: FormData) {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect("/rfq");

  const quantity = str(formData, "quantity");
  if (!quantity) redirect(`/rfq/new?error=quantity`);

  const targetRaw = str(formData, "targetDeliveryDate");

  const rfq = await createRfq({
    buyerId: buyerId!,
    productId: str(formData, "productId"),
    categoryId: str(formData, "categoryId"),
    quantity: quantity!,
    notes: str(formData, "notes"),
    targetDeliveryDate: targetRaw ? new Date(targetRaw) : undefined,
  });

  redirect(`/rfq/${rfq.id}`);
}

async function assertOwnsRfq(rfqId: string) {
  const buyerId = await getCurrentBuyerId();
  const rfq = await getRfqWithQuotes(rfqId);
  if (!rfq || rfq.buyerId !== buyerId) redirect(`/rfq/${rfqId}`);
  return rfq;
}

export async function acceptQuoteAction(formData: FormData) {
  const rfqId = str(formData, "rfqId")!;
  const quoteId = str(formData, "quoteId")!;
  await assertOwnsRfq(rfqId);
  await acceptQuote(quoteId);
  redirect(`/rfq/${rfqId}`);
}

export async function rejectQuoteAction(formData: FormData) {
  const rfqId = str(formData, "rfqId")!;
  const quoteId = str(formData, "quoteId")!;
  await assertOwnsRfq(rfqId);
  await rejectQuote(quoteId);
  redirect(`/rfq/${rfqId}`);
}
