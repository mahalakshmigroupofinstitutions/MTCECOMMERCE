"use client";

import { useEffect, useState } from "react";
import { SubmitButton, buttonClassName } from "@/components/ui";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export interface OtpVerifyFormProps {
  cooldownSeconds: number;
  /** The three server actions that drive this screen. Generalized to props
   * (rather than importing app/(buyer)/register/actions.ts directly) so both
   * the registration and login OTP screens can share this exact component —
   * registration's own verify page passes its existing actions unchanged, so
   * its behavior is byte-for-byte the same as before. */
  verifyAction: (formData: FormData) => void | Promise<void>;
  resendAction: () => void | Promise<void>;
  changeAction: () => void | Promise<void>;
  changeLabel?: string;
}

/** The code + resend/countdown/change-details controls for the OTP step.
 * A client component only for the resend countdown timer — the server
 * actions it calls are the real enforcement; this is UX only. Remounts (and
 * so restarts its countdown) on every hard navigation back to this page,
 * which is exactly when a fresh code was just sent. */
export function OtpVerifyForm({
  cooldownSeconds,
  verifyAction,
  resendAction,
  changeAction,
  changeLabel = "Wrong number? Change phone or details",
}: OtpVerifyFormProps) {
  const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div className="mt-5 flex flex-col gap-3">
      <form action={verifyAction} className="flex flex-col gap-3">
        <input
          name="code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="6-digit code"
          autoFocus
          className={`${inputClass} text-center font-mono text-lg tracking-[0.5em]`}
        />
        <SubmitButton pendingText="Verifying…" className={buttonClassName({ full: true })}>
          Verify
        </SubmitButton>
      </form>

      <form action={resendAction}>
        <button
          type="submit"
          disabled={secondsLeft > 0}
          className={buttonClassName({ variant: "outline", full: true })}
        >
          {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
        </button>
      </form>

      <form action={changeAction}>
        <button type="submit" className="w-full text-center text-[12.5px] font-semibold text-sub underline">
          {changeLabel}
        </button>
      </form>
    </div>
  );
}
