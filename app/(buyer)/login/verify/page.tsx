import { redirect } from "next/navigation";
import {
  getPendingLoginPhone,
  verifyLoginOtpAction,
  resendLoginOtpAction,
  changePendingLoginAction,
} from "@/app/(buyer)/login/actions";
import { OtpVerifyForm } from "@/components/buyer/OtpVerifyForm";
import { BUYER_OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/buyerOtp";
import { maskPhone } from "@/lib/phone";

export const revalidate = 0;

const ERROR_MESSAGES: Record<string, string> = {
  invalidCode: "That code isn't right. Please check it and try again.",
  expired: "That code has expired. Request a new one below.",
  tooManyAttempts: "Too many incorrect attempts. Request a new code below.",
  tooSoon: "Please wait a little before requesting another code.",
  rateLimited: "Too many code requests for this number. Please try again in a while.",
};

export default async function LoginVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  // No pending login (never started, already completed, or the 15-minute
  // pending cookie expired) — there's nothing to verify.
  const phone = await getPendingLoginPhone();
  if (!phone) redirect("/login");

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong. Please try again.") : undefined;

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-lg font-extrabold text-ink">Verify your number</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        We sent a 6-digit code to <span className="font-mono font-semibold text-ink">{maskPhone(phone!)}</span>.
        Enter it below to log in.
      </p>

      {errorMessage && (
        <p role="alert" className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          {errorMessage}
        </p>
      )}
      {!errorMessage && sent === "1" && (
        <p role="status" className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          We sent a new code.
        </p>
      )}

      <OtpVerifyForm
        cooldownSeconds={BUYER_OTP_RESEND_COOLDOWN_SECONDS}
        verifyAction={verifyLoginOtpAction}
        resendAction={resendLoginOtpAction}
        changeAction={changePendingLoginAction}
        changeLabel="Wrong number? Go back"
      />
    </div>
  );
}
