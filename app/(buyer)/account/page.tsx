import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentBuyerId, getCurrentBuyer } from "@/lib/session";
import { updateProfile, logoutBuyer } from "@/app/(buyer)/account/actions";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

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
        <form action={updateProfile} className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-faint">Mobile number</div>
            <div className="rounded-xl border border-line bg-wash px-3.5 py-3 font-mono text-sm text-sub">
              {buyer?.phone}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-ink">Name</div>
            <input name="name" defaultValue={buyer?.name ?? ""} className={inputClass} />
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-bold text-ink">Company name</div>
            <input name="companyName" defaultValue={buyer?.companyName ?? ""} className={inputClass} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="mb-1.5 text-[12px] font-bold text-ink">GST number</div>
              <input name="gstNumber" defaultValue={buyer?.gstNumber ?? ""} className={inputClass} />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 text-[12px] font-bold text-ink">City</div>
              <input name="city" defaultValue={buyer?.city ?? ""} className={inputClass} />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 text-[12px] font-bold text-ink">State</div>
              <input name="state" defaultValue={buyer?.state ?? ""} className={inputClass} />
            </div>
          </div>
          <SubmitButton pendingText="Saving…" className={`${buttonClassName({ size: "sm" })} self-start`}>
            Save changes
          </SubmitButton>
        </form>
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
