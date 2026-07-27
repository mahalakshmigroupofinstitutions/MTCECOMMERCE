import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { getCurrentVendor } from "@/lib/vendorSession";
import { ONBOARDING_STEPS } from "@/lib/vendorOnboarding";

export const revalidate = 0;

export default async function VendorPendingPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login?next=/vendor/pending");
  if (vendor.onboardingStatus === "DRAFT") {
    redirect(`/vendor/onboarding/${ONBOARDING_STEPS[vendor.onboardingStep] ?? "business"}`);
  }
  if (vendor.onboardingStatus === "APPROVED") redirect("/vendor");

  const rejected = vendor.onboardingStatus === "REJECTED";

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${rejected ? "bg-wash" : "bg-wash"}`}>
        <Icon name={rejected ? "x" : "clock"} size={26} className={rejected ? "text-accent" : "text-ink"} />
      </div>

      {rejected ? (
        <>
          <h1 className="mt-5 text-lg font-extrabold text-ink">Application not approved</h1>
          <p className="mt-2 text-[13px] text-sub">
            Your vendor application wasn&rsquo;t approved. Reach out to support for details on next steps.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-5 text-lg font-extrabold text-ink">Verification in progress</h1>
          <p className="mt-2 text-[13px] text-sub">
            Thanks for submitting your application. Our team typically reviews new vendors within{" "}
            <strong className="text-ink">24–48 hours</strong>. We&rsquo;ll email you at{" "}
            <strong className="text-ink">{vendor.email}</strong> once a decision is made.
          </p>
        </>
      )}

      <p className="mt-4 text-[12.5px] text-sub">
        You can keep setting up your shop in the meantime — it just won&rsquo;t be visible to buyers until you&rsquo;re
        approved.
      </p>

      <Link href="/vendor" className={`${buttonClassName({ full: true })} mt-6`}>
        Go to dashboard
      </Link>
    </div>
  );
}
