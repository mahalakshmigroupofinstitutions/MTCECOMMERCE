import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentBuyerId, getCurrentBuyer } from "@/lib/session";
import { logoutBuyer } from "@/app/(buyer)/account/actions";
import { AccountDetailsCard } from "@/components/buyer/AccountDetailsCard";
import { getAllCountries, findCountryIsoByName, findStateIsoByName } from "@/lib/location";

export const revalidate = 0;

/* Profile/company information only. Saved suppliers live at /saved-suppliers
 * and RFQ history lives at /rfq — this page used to fold both in, which made
 * it behave like a second dashboard. Keep it to just the fields a buyer edits
 * about themselves. */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next } = await searchParams;
  const buyerId = await getCurrentBuyerId();

  if (!buyerId) {
    redirect(`/login?next=${encodeURIComponent(next ?? "/account")}`);
  }

  const buyer = await getCurrentBuyer();
  const countries = getAllCountries();
  const countryIso = findCountryIsoByName(buyer?.country) ?? "IN";
  const stateIso = findStateIsoByName(countryIso, buyer?.state);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold text-ink">Account details</h1>
        <form action={logoutBuyer}>
          <SubmitButton pendingText="Logging out…" className={buttonClassName({ variant: "outline", size: "sm" })}>
            Log out
          </SubmitButton>
        </form>
      </div>

      <div className="rounded-2xl border border-line p-5">
        <h2 className="mb-4 text-[15px] font-extrabold text-ink">Profile</h2>
        <AccountDetailsCard
          buyer={{
            phone: buyer?.phone ?? "",
            name: buyer?.name ?? null,
            companyName: buyer?.companyName ?? null,
            gstNumber: buyer?.gstNumber ?? null,
            addressLine1: buyer?.addressLine1 ?? null,
            addressLine2: buyer?.addressLine2 ?? null,
            country: buyer?.country ?? null,
            state: buyer?.state ?? null,
            city: buyer?.city ?? null,
            pincode: buyer?.pincode ?? null,
          }}
          countries={countries}
          countryIso={countryIso}
          stateIso={stateIso}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-line p-4 text-center text-[13px] text-sub">
        Are you a supplier?{" "}
        <Link href="/vendor" className="font-bold text-ink underline">
          Log in to your vendor dashboard
        </Link>
      </div>
    </div>
  );
}
