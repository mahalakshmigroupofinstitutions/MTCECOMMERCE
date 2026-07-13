import { identifyAndContinue } from "@/app/rfq/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export function IdentifyForm({ next, error }: { next: string; error?: boolean }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-lg font-extrabold text-ink">Tell us about your business</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        A few quick details so suppliers know who&rsquo;s requesting quotes. No OTP yet in this build — that lands in a
        later phase.
      </p>
      {error && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please fill in your name and a valid phone number.
        </p>
      )}
      <form action={identifyAndContinue} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <input name="name" required placeholder="Your name" className={inputClass} />
        <input name="phone" required type="tel" placeholder="Mobile number" className={inputClass} />
        <input name="companyName" placeholder="Company name (optional)" className={inputClass} />
        <input name="city" placeholder="City (optional)" className={inputClass} />
        <SubmitButton pendingText="Continuing…" className={buttonClassName({ full: true })}>
          Continue
        </SubmitButton>
      </form>
    </div>
  );
}
