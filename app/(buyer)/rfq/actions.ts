"use server";

import { redirect } from "next/navigation";
import { identifyBuyer, getCurrentBuyerId } from "@/lib/session";
import { createRfq, acceptQuote, rejectQuote, getRfqWithQuotes } from "@/lib/rfq";
import { str } from "@/lib/formData";

export async function identifyAndContinue(formData: FormData) {
  const phoneRaw = str(formData, "phone") ?? "";
  const digits = phoneRaw.replace(/\D/g, "");
  const name = str(formData, "name");
  const next = str(formData, "next") ?? "/rfq";

  if (digits.length < 8 || !name) {
    redirect(`${next.includes("?") ? next + "&" : next + "?"}error=identify`);
  }

  await identifyBuyer({
    // 10-digit input is a bare local number (needs +91); anything else is assumed
    // to already include a country code. `digits.startsWith("91")` was wrong here —
    // it misfired for any bare 10-digit number that happens to start with "91".
    phone: digits.length === 10 ? `+91${digits}` : `+${digits}`,
    name: name!,
    companyName: str(formData, "companyName"),
    city: str(formData, "city"),
  });

  redirect(next);
}

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
