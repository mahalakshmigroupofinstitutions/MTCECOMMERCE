import { identifyVendorAndContinue } from "@/app/vendor/actions";
import { buttonClassName, SubmitButton } from "@/components/ui";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

export default async function VendorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-6 py-14">
      <h1 className="text-lg font-extrabold text-ink">Vendor login</h1>
      <p className="mt-1.5 text-[13px] text-sub">
        Enter your business phone number to access your dashboard. If it matches an existing listing, you&rsquo;ll log
        straight into it — otherwise a new (unverified) listing is created. No OTP yet in this build.
      </p>
      {error === "identify" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please fill in your business name, phone number, and city.
        </p>
      )}
      <form action={identifyVendorAndContinue} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? "/vendor"} />
        <input name="name" required placeholder="Business name" className={inputClass} />
        <input name="phone" required type="tel" placeholder="Mobile number" className={inputClass} />
        <input name="city" required placeholder="City, State" className={inputClass} />
        <SubmitButton pendingText="Logging in…" className={buttonClassName({ full: true })}>
          Continue
        </SubmitButton>
      </form>
    </div>
  );
}
