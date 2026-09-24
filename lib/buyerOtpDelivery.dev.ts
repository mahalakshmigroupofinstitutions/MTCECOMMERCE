/* Development-only OTP "delivery": prints the code to the server console
 * instead of sending an SMS. This file exists so the fake path is impossible
 * to mistake for a real one — it is never imported outside
 * lib/buyerOtpDelivery.ts, and that file only reaches it when NOT running in
 * production. Nothing here ever reaches the browser: this runs server-side
 * and the code is never included in any response body, redirect, or URL. */
import "server-only";
import type { BuyerOtpDeliveryPayload } from "@/lib/buyerOtpDelivery";

export async function sendBuyerOtpDev({ phone, code, purpose }: BuyerOtpDeliveryPayload): Promise<void> {
  console.log(`[DEV OTP — not a real SMS] ${purpose} code for ${phone}: ${code}`);
}
