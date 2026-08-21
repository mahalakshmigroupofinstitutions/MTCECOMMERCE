import { requireOnboardingStep } from "@/lib/vendorOnboarding";
import { saveOnboardingBankAction } from "@/app/vendor/onboarding/actions";
import { SubmitButton, Input, Select, FormField, buttonClassName } from "@/components/ui";
import { OnboardingStepper } from "@/components/vendor/OnboardingStepper";

export const revalidate = 0;

const ERROR_MESSAGES: Record<string, string> = {
  identify: "Please fill in all required fields.",
  mismatch: "Account number and confirmation don't match.",
  ifsc: "Enter a valid IFSC code (e.g. HDFC0001234).",
};

const VERIFICATION_LABELS: Record<string, string> = {
  NOT_VERIFIED: "Not verified — pending manual review",
  PENDING: "Verification in progress",
  VERIFIED: "Verified",
};

export default async function OnboardingBankPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [supplier, { error }] = await Promise.all([requireOnboardingStep("bank"), searchParams]);
  const bank = supplier.bankDetail;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div>
      <OnboardingStepper current="bank" />

      <h1 className="mt-6 text-lg font-extrabold text-ink">Bank & payout details</h1>
      <p className="mt-1.5 text-[13px] text-sub">Where should we send your payouts?</p>

      {errorMessage && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">{errorMessage}</p>
      )}

      <form action={saveOnboardingBankAction} className="mt-5 flex flex-col gap-3.5">
        <FormField htmlFor="accountHolder" label="Account holder name" required>
          <Input id="accountHolder" name="accountHolder" required defaultValue={bank?.accountHolder ?? ""} />
        </FormField>

        <FormField htmlFor="bankName" label="Bank name" required>
          <Input id="bankName" name="bankName" required defaultValue={bank?.bankName ?? ""} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField htmlFor="accountNumber" label="Account number" required>
            <Input id="accountNumber" name="accountNumber" required defaultValue={bank?.accountNumber ?? ""} />
          </FormField>
          <FormField htmlFor="confirmAccountNumber" label="Confirm account number" required>
            <Input id="confirmAccountNumber" name="confirmAccountNumber" required defaultValue={bank?.accountNumber ?? ""} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField htmlFor="ifscCode" label="IFSC code" required>
            <Input
              id="ifscCode"
              name="ifscCode"
              required
              className="uppercase"
              defaultValue={bank?.ifscCode ?? ""}
            />
          </FormField>
          <FormField htmlFor="accountType" label="Account type" required>
            <Select id="accountType" name="accountType" required defaultValue={bank?.accountType ?? ""}>
              <option value="" disabled>
                Choose one
              </option>
              <option value="CURRENT">Current account</option>
              <option value="SAVINGS">Savings account</option>
            </Select>
          </FormField>
        </div>

        <FormField htmlFor="upiId" label="UPI ID" hint="Optional">
          <Input id="upiId" name="upiId" placeholder="you@bank" defaultValue={bank?.upiId ?? ""} />
        </FormField>

        <div>
          <div className="mb-1.5 text-[12.5px] font-bold text-ink">Bank verification status</div>
          <div className="rounded-xl border border-line bg-wash px-3.5 py-3 text-[12.5px] font-semibold text-sub">
            {VERIFICATION_LABELS[bank?.verificationStatus ?? "NOT_VERIFIED"]}
          </div>
        </div>

        <SubmitButton pendingText="Saving…" className={buttonClassName({ variant: "success", full: true, size: "lg" })}>
          Save & continue
        </SubmitButton>
      </form>
    </div>
  );
}
