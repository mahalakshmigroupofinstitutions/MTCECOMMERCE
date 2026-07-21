import Link from "next/link";
import { loginBuyer } from "@/app/(buyer)/account/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const registerHref = `/register${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-lg font-extrabold text-ink">Log in</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Enter the mobile number you registered with. No OTP yet in this build — that lands in a later phase.
      </p>
      {error === "identify" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please enter a valid phone number.
        </p>
      )}
      <form action={loginBuyer} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/account"} />
        <input name="phone" required type="tel" placeholder="Mobile number" className={inputClass} />
        <SubmitButton pendingText="Logging in…" className={buttonClassName({ full: true })}>
          Continue
        </SubmitButton>
      </form>
      <p className="mt-4 text-center text-[13px] text-sub">
        New here?{" "}
        <Link href={registerHref} className="font-bold text-ink underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
