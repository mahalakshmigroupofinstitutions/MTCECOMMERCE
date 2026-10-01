import Link from "next/link";
import { requestRegisterOtpAction } from "@/app/(buyer)/register/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { AddressFields } from "@/components/buyer/AddressFields";
import { getAllCountries, getPhoneCountryCodes } from "@/lib/location";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

const ERROR_MESSAGES: Record<string, string> = {
  identify: "Please fill in your name, mobile number, company name, and address.",
  invalidPhone: "That mobile number doesn't look right for the selected country code.",
  invalidGstin: "That GSTIN doesn't look valid — double-check it.",
  gstinRequired: "You selected GST registered — please enter your GSTIN.",
  notfound: "No account found for that number — create one below.",
  tooSoon: "You already have a code on the way — please wait a little before requesting another.",
  rateLimited: "Too many code requests for this number. Please try again in a while.",
  sessionExpired: "That took a bit long — please start again.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const loginHref = `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;
  const countries = getAllCountries();
  const phoneCountryCodes = getPhoneCountryCodes();

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-lg font-extrabold text-ink">Create your buyer account</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        A few quick details so suppliers know who&rsquo;s requesting quotes. We&rsquo;ll text a one-time code to your
        mobile number to confirm it&rsquo;s really you.
      </p>
      {errorMessage && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">{errorMessage}</p>
      )}
      <form action={requestRegisterOtpAction} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/"} />
        <input name="name" required placeholder="Your name" className={inputClass} />
        <input name="companyName" required placeholder="Company name" className={inputClass} />
        <AddressFields countries={countries} phoneCountryCodes={phoneCountryCodes} includePhone />
        <SubmitButton pendingText="Sending code…" className={buttonClassName({ full: true })}>
          Send verification code
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
