import Link from "next/link";
import { registerBuyer } from "@/app/(buyer)/account/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-lg font-extrabold text-ink">Create your buyer account</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        A few quick details so suppliers know who&rsquo;s requesting quotes. No OTP yet in this build — that lands in a
        later phase.
      </p>
      {error === "identify" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please fill in your name and a valid phone number.
        </p>
      )}
      {error === "notfound" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          No account found for that number — create one below.
        </p>
      )}
      <form action={registerBuyer} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/account"} />
        <input name="name" required placeholder="Your name" className={inputClass} />
        <input name="phone" required type="tel" placeholder="Mobile number" className={inputClass} />
        <input name="companyName" placeholder="Company name (optional)" className={inputClass} />
        <input name="gstNumber" placeholder="GST number (optional)" className={inputClass} />
        <input name="city" placeholder="City (optional)" className={inputClass} />
        <SubmitButton pendingText="Creating account…" className={buttonClassName({ full: true })}>
          Create account
        </SubmitButton>
      </form>
      <p className="mt-4 text-center text-[13px] text-sub">
        Already have an account?{" "}
        <Link href={loginHref} className="font-bold text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
