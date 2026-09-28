"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyerId, identifyBuyer } from "@/lib/session";
import { createRfq, acceptQuote, rejectQuote, getRfqWithQuotes } from "@/lib/rfq";
import { normalizePhone } from "@/lib/phone";
import { str, file, withErrorParam as withError } from "@/lib/formData";
import {
  ALLOWED_RFQ_ATTACHMENT_TYPES,
  MAX_RFQ_ATTACHMENT_BYTES,
  deleteVendorPrivateFile,
  saveRfqAttachment,
  validateUpload,
} from "@/lib/localFileStorage";

export async function submitRfq(formData: FormData) {
  let buyerId = await getCurrentBuyerId();

  if (!buyerId) {
    const name = str(formData, "guestName");
    const phone = normalizePhone(str(formData, "guestPhone"));

    if (!name || !phone) {
      redirect(withError("/rfq/new", "identify"));
    }

    const buyer = await identifyBuyer({
      phone: phone!,
      name: name!,
      companyName: str(formData, "guestCompanyName"),
      gstNumber: str(formData, "guestGstNumber"),
      city: str(formData, "guestCity"),
    });
    buyerId = buyer.id;
  }

  const quantity = str(formData, "quantity");
  if (!quantity) redirect(`/rfq/new?error=quantity`);

  // Optional attachment — validated and uploaded through the shared Blob
  // storage abstraction (the same module vendor documents/images use), never
  // a second, RFQ-specific storage system. Private: an RFQ's BOQ/spec sheet
  // can carry pricing/technical detail the buyer didn't post publicly.
  const specSheet = file(formData, "specSheet");
  let specSheetUrl: string | undefined;
  if (specSheet) {
    const rejection = validateUpload(specSheet, {
      allowed: ALLOWED_RFQ_ATTACHMENT_TYPES,
      maxBytes: MAX_RFQ_ATTACHMENT_BYTES,
    });
    if (rejection) redirect(`/rfq/new?error=attachment`);
    const saved = await saveRfqAttachment(specSheet, buyerId!);
    specSheetUrl = saved.filePath;
  }

  const targetRaw = str(formData, "targetDeliveryDate");
  const deadlineRaw = str(formData, "submissionDeadline");
  const intent = str(formData, "intent");

  let rfq;
  try {
    rfq = await createRfq({
      buyerId: buyerId!,
      productId: str(formData, "productId"),
      categoryId: str(formData, "categoryId"),
      quantity: quantity!,
      uom: str(formData, "uom"),
      notes: str(formData, "notes"),
      targetPrice: str(formData, "targetPrice"),
      concession: str(formData, "concession"),
      deliveryTimeline: str(formData, "deliveryTimeline"),
      deliveryMode: str(formData, "deliveryMode"),
      paymentTerms: str(formData, "paymentTerms"),
      specSheetUrl,
      targetDeliveryDate: targetRaw ? new Date(targetRaw) : undefined,
      submissionDeadline: deadlineRaw ? new Date(deadlineRaw) : undefined,
      status: intent === "draft" ? "DRAFT" : "OPEN",
    });
  } catch (err) {
    // The row never committed — don't leave the just-uploaded attachment orphaned.
    if (specSheetUrl) await deleteVendorPrivateFile(specSheetUrl);
    throw err;
  }

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