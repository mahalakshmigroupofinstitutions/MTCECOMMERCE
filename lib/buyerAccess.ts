/* Buyer authorization guard — mirrors lib/vendorAccess.ts's requireVendorId().
 * Used only by the dashboard for now; existing buyer pages keep their own
 * inline `if (!buyerId) redirect(...)` checks untouched. */
import "server-only";
import { redirect } from "next/navigation";
import { getCurrentBuyerId } from "@/lib/session";

/** The authenticated buyer's id, or a redirect to login. Every dashboard entry
 * point derives identity here — a buyerId is never accepted from the client. */
export async function requireBuyerId(nextPath: string): Promise<string> {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return buyerId;
}
