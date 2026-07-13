"use server";

import { redirect } from "next/navigation";
import { identifyBuyer, getCurrentBuyerId } from "@/lib/session";
import { createRfq, createQuote, acceptQuote, rejectQuote, getRfqWithQuotes } from "@/lib/rfq";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

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

export async function submitQuote(formData: FormData) {
  const rfqId = str(formData, "rfqId");
  const supplierId = str(formData, "supplierId");
  const priceRaw = str(formData, "price");
  if (!rfqId || !supplierId || !priceRaw) redirect(`/rfq/${rfqId}/quotes/new?error=1`);

  const validUntilRaw = str(formData, "validUntil");

  await createQuote({
    rfqId: rfqId!,
    supplierId: supplierId!,
    price: Math.round(Number(priceRaw)),
    unit: str(formData, "unit") ?? "unit",
    moq: str(formData, "moq"),
    delivery: str(formData, "delivery"),
    payment: str(formData, "payment"),
    validUntil: validUntilRaw ? new Date(validUntilRaw) : undefined,
    note: str(formData, "note"),
    best: formData.get("best") === "on",
  });

  redirect(`/rfq/${rfqId}`);
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
