/* Deferred: no transactional email provider (Resend/etc.) is wired up yet —
 * pending approval. These stubs keep the vendor flow's intent visible to
 * reviewers without blocking on the integration; swap the bodies for a real
 * send once approved. */
import "server-only";

export async function sendVendorVerificationEmailStub(email: string) {
  console.log(`[mailer stub] would send email-verification link to ${email}`);
}

export async function sendVendorApplicationSubmittedEmailStub(email: string) {
  console.log(`[mailer stub] would send "application submitted for review" email to ${email}`);
}
