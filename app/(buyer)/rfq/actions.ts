"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyer, getCurrentBuyerId } from "@/lib/session";
import {
  createRfq,
  resolveRfqTarget,
  acceptRfqQuoteForBuyer,
  rejectRfqQuoteForBuyer,
  QuoteActionError,
} from "@/lib/rfq";
import { validateRfqForm } from "@/lib/rfqForm";
import { str, file, withErrorParam as withError } from "@/lib/formData";
import {
  ALLOWED_RFQ_ATTACHMENT_TYPES,
  MAX_RFQ_ATTACHMENT_BYTES,
  deleteVendorPrivateFile,
  saveRfqAttachment,
  validateUpload,
} from "@/lib/localFileStorage";

/** Back to the form, keeping the product the buyer started from (if any). */
function rfqFormPath(productSlug: string | undefined) {
  return productSlug ? `/rfq/new?product=${encodeURIComponent(productSlug)}` : "/rfq/new";
}

/** RFQs are only ever created for an OTP-verified buyer session. The old
 * guest path (name + phone → identifyBuyer) is gone: it started a session for
 * whatever phone number was typed, which would let anyone open another
 * buyer's RFQs and accept their quotes by entering that buyer's number. */
export async function submitRfq(formData: FormData) {
  const productSlug = str(formData, "productSlug");
  const formPath = rfqFormPath(productSlug);

  // getCurrentBuyer (not just the cookie) so a stale session for a deleted
  // buyer is sent to log in rather than failing on the RFQ's foreign key.
  const buyer = await getCurrentBuyer();
  if (!buyer) redirect(`/login?next=${encodeURIComponent(formPath)}`);
  const buyerId = buyer!.id;

  // Validate everything before uploading anything, so a rejected form never
  // leaves an orphaned attachment behind.
  const validation = validateRfqForm({
    quantity: str(formData, "quantity"),
    uom: str(formData, "uom"),
    notes: str(formData, "notes"),
    targetPrice: str(formData, "targetPrice"),
    concession: str(formData, "concession"),
    deliveryTimeline: str(formData, "deliveryTimeline"),
    deliveryMode: str(formData, "deliveryMode"),
    paymentTerms: str(formData, "paymentTerms"),
    targetDeliveryDate: str(formData, "targetDeliveryDate"),
    submissionDeadline: str(formData, "submissionDeadline"),
  });
  if (!validation.ok) redirect(withError(formPath, validation.error));
  const { data } = validation as Extract<typeof validation, { ok: true }>;

  const target = await resolveRfqTarget({
    productId: str(formData, "productId"),
    categoryId: str(formData, "categoryId"),
  });
  if (!target) redirect(withError(formPath, "target"));

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
    if (rejection) redirect(withError(formPath, "attachment"));
    const saved = await saveRfqAttachment(specSheet, buyerId);
    specSheetUrl = saved.filePath;
  }

  const intent = str(formData, "intent");

  let rfq;
  try {
    rfq = await createRfq({
      buyerId,
      ...target,
      ...data,
      specSheetUrl,
      status: intent === "draft" ? "DRAFT" : "OPEN",
    });
  } catch (err) {
    // The row never committed — don't leave the just-uploaded attachment orphaned.
    if (specSheetUrl) await deleteVendorPrivateFile(specSheetUrl);
    console.error("submitRfq: failed to create RFQ", err);
    redirect(withError(formPath, "unexpected"));
  }

  redirect(`/rfq/${rfq!.id}`);
}

type QuoteAction = (buyerId: string, rfqId: string, quoteId: string) => Promise<unknown>;

/** Shared accept/reject wrapper: identity comes only from the session, the
 * ownership/state checks live in lib/rfq.ts, and every failure becomes an
 * ?error= on the RFQ page instead of an unhandled exception. */
async function runQuoteAction(formData: FormData, action: QuoteAction, label: string) {
  const rfqId = str(formData, "rfqId");
  const quoteId = str(formData, "quoteId");
  if (!rfqId || !quoteId) redirect("/rfq");
  const rfqPath = `/rfq/${encodeURIComponent(rfqId!)}`;

  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect(`/login?next=${encodeURIComponent(rfqPath)}`);

  let errorCode: string | undefined;
  try {
    await action(buyerId!, rfqId!, quoteId!);
  } catch (err) {
    if (err instanceof QuoteActionError) {
      errorCode = err.code;
    } else {
      console.error(`${label}: unexpected failure`, err);
      errorCode = "unexpected";
    }
  }

  // redirect() works by throwing, so it stays outside the try/catch above.
  redirect(errorCode ? withError(rfqPath, errorCode) : rfqPath);
}

export async function acceptQuoteAction(formData: FormData) {
  await runQuoteAction(formData, acceptRfqQuoteForBuyer, "acceptQuoteAction");
}

export async function rejectQuoteAction(formData: FormData) {
  await runQuoteAction(formData, rejectRfqQuoteForBuyer, "rejectQuoteAction");
}
