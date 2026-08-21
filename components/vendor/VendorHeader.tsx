import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { getCurrentVendor } from "@/lib/vendorSession";
import { vendorLogout } from "@/app/vendor/actions";
import { ONBOARDING_STEPS } from "@/lib/vendorOnboarding";
import { VendorNav } from "@/components/vendor/VendorNav";

export async function VendorHeader() {
  const vendor = await getCurrentVendor();

  const BANNERS: Partial<Record<NonNullable<typeof vendor>["onboardingStatus"], string>> = {
    PENDING_VERIFICATION: "Verification pending — view status",
    UNDER_REVIEW: "Application under review — view status",
    CHANGES_REQUESTED: "Changes requested — view details",
    REJECTED: "Application rejected — view details",
  };

  const banner = !vendor
    ? null
    : vendor.onboardingStatus === "DRAFT"
      ? {
          href: `/vendor/onboarding/${ONBOARDING_STEPS[vendor.onboardingStep] ?? "business"}`,
          label: "Finish setting up your account",
        }
      : BANNERS[vendor.onboardingStatus]
        ? { href: "/vendor/pending", label: BANNERS[vendor.onboardingStatus]! }
        : null;

  return (
    <header className="sticky top-0 z-20 bg-ink shadow-md shadow-ink/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/vendor" className="flex items-center gap-2.5">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-white text-base font-extrabold text-ink">
            N
          </span>
          <span className="text-[15px] font-extrabold tracking-tight text-white">
            NextGen <span className="text-white/55">Vendor</span>
          </span>
        </Link>

        <VendorNav />

        <div className="flex-1" />

        {vendor ? (
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {banner && (
              <Link
                href={banner.href}
                className="max-w-[120px] truncate rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink sm:max-w-none"
              >
                {banner.label} →
              </Link>
            )}
            <Link href="/" className="hidden text-[12.5px] font-semibold text-white/55 hover:text-white sm:inline">
              Buyer site
            </Link>
            <span className="hidden text-[13px] font-bold text-white md:inline">{vendor.name}</span>
            <form action={vendorLogout}>
              <button type="submit" className={buttonClassName({ variant: "outline", size: "sm" })}>
                <Icon name="arrow-left" size={14} strokeWidth={2} /> Log out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/vendor/login" className={buttonClassName({ size: "sm" })}>
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
