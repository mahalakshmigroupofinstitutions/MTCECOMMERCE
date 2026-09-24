/* OTP delivery abstraction — the only file that needs to change when a real
 * SMS provider is wired up. lib/buyerOtp.ts calls sendBuyerOtp() and never
 * knows or cares how (or whether) the code actually reaches a phone.
 *
 * No SMS provider is configured yet. In development, the code is printed to
 * the server console (lib/buyerOtpDelivery.dev.ts) — clearly labeled, and
 * kept in its own file so it can never be mistaken for production behavior.
 * In production this throws rather than silently pretending to have sent
 * something nobody received; that failure surfaces to the caller as a normal
 * "couldn't send" error rather than a fake success. */
import "server-only";
import type { BuyerOtpPurpose } from "@/lib/generated/prisma/client";

export interface BuyerOtpDeliveryPayload {
  phone: string;
  code: string;
  purpose: BuyerOtpPurpose;
}

export async function sendBuyerOtp(payload: BuyerOtpDeliveryPayload): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    // TODO: replace with a real SMS provider (e.g. Twilio, MSG91, SNS) before
    // enabling buyer OTP in production. Send `payload.code` to `payload.phone`
    // and let this throw on failure — lib/buyerOtp.ts already treats a thrown
    // error here as "delivery failed, don't persist or count this request."
    throw new Error(
      "sendBuyerOtp: no SMS provider is configured for production. Wire one in lib/buyerOtpDelivery.ts.",
    );
  }

  const { sendBuyerOtpDev } = await import("@/lib/buyerOtpDelivery.dev");
  await sendBuyerOtpDev(payload);
}
