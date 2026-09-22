import Link from "next/link";
import { registerVendorAction } from "@/app/vendor/actions";
import { buttonClassName, Button, SubmitButton, Input, FormField } from "@/components/ui";
import { GoogleGlyph } from "@/components/vendor/GoogleGlyph";

export const revalidate = 0;

const ERROR_MESSAGES: Record<string, string> = {
  identify: "Please fill in your name, phone number, and email/password.",
  weak: "Password must be at least 8 characters.",
  mismatch: "Passwords don't match.",
  terms: "Please accept the Terms & Privacy Policy to continue.",
  exists: "An account with that email or phone number already exists.",
};

export default async function VendorSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-lg font-extrabold text-ink">Create your vendor account</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Set up your account, then complete a short onboarding to list your business.
      </p>

      {errorMessage && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">{errorMessage}</p>
      )}

      <Button type="button" disabled variant="outline" full className="mt-5 gap-2.5">
        <GoogleGlyph />
        Continue with Google
        <span className="text-[11px] font-semibold text-faint">(coming soon)</span>
      </Button>

      <div className="my-5 flex items-center gap-3 text-[11.5px] font-semibold text-faint">
        <div className="h-px flex-1 bg-line" />
        OR
        <div className="h-px flex-1 bg-line" />
      </div>

      <form action={registerVendorAction} className="flex flex-col gap-3.5">
        <FormField htmlFor="contactName" label="Full name" required>
          <Input id="contactName" name="contactName" required placeholder="Your name" />
        </FormField>

        <FormField htmlFor="phone" label="Phone number" required>
          <Input id="phone" name="phone" required type="tel" placeholder="Mobile number" />
        </FormField>

        <FormField htmlFor="email" label="Email address" required>
          <Input id="email" name="email" required type="email" placeholder="you@business.com" />
        </FormField>

        <FormField htmlFor="password" label="Password" required>
          <Input id="password" name="password" required type="password" minLength={8} placeholder="At least 8 characters" />
        </FormField>

        <FormField htmlFor="confirmPassword" label="Confirm password" required>
          <Input id="confirmPassword" name="confirmPassword" required type="password" minLength={8} />
        </FormField>

        <FormField htmlFor="dateOfBirth" label="Date of birth" hint="Optional">
          <Input id="dateOfBirth" name="dateOfBirth" type="date" />
        </FormField>

        <label className="flex items-start gap-2 text-[12.5px] text-sub">
          <input type="checkbox" name="acceptedTerms" required className="mt-0.5" />
          I accept the Terms of Service and Privacy Policy
        </label>

        <SubmitButton pendingText="Creating account…" className={buttonClassName({ variant: "success", full: true })}>
          Continue
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-[13px] text-sub">
        Already have an account?{" "}
        <Link href="/vendor/login" className="font-bold text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
