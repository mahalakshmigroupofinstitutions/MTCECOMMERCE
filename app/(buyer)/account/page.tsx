import Link from "next/link";
import { redirect } from "next/navigation";
import { SupplierCard } from "@/components/catalog/SupplierCard";
import { buttonClassName, SubmitButton } from "@/components/ui";
import { getCurrentBuyerId, getCurrentBuyer } from "@/lib/session";
import { getSavedSuppliers } from "@/lib/account";
import { getRfqsForBuyer } from "@/lib/rfq";
import { updateProfile, logoutBuyer } from "@/app/(buyer)/account/actions";

export const revalidate = 0;

const inputClass = "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint";

const RFQ_STATUS_LABEL: Record<string, string> = {
  OPEN: "Awaiting quotes",
  QUOTED: "Quotes received",
  CLOSED: "Order placed",
};

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

  const [buyer, savedSuppliers, rfqs] = await Promise.all([
    getCurrentBuyer(),
    getSavedSuppliers(buyerId),
    getRfqsForBuyer(buyerId),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-lg font-extrabold text-ink">Account</h1>
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
          </div>
          <SubmitButton pendingText="Saving…" className={`${buttonClassName({ size: "sm" })} self-start`}>
            Save changes
          </SubmitButton>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-[15px] font-extrabold text-ink">Saved suppliers</h2>
        {savedSuppliers.length === 0 ? (
          <div className="rounded-2xl border border-line p-6 text-center text-[13px] text-sub">
            No saved suppliers yet — tap Save on a supplier&rsquo;s profile to bookmark them here.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible">
            {savedSuppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-extrabold text-ink">RFQ history</h2>
          <Link href="/rfq" className="text-[12.5px] font-bold text-sub">
            View all
          </Link>
        </div>
        {rfqs.length === 0 ? (
          <div className="rounded-2xl border border-line p-6 text-center text-[13px] text-sub">
            You haven&rsquo;t requested any quotes yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rfqs.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/rfq/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line p-3.5"
              >
                <div className="min-w-0 truncate text-[13.5px] font-bold text-ink">
                  {r.product?.title ?? r.category?.name ?? "General requirement"}
                </div>
                <span className="flex-shrink-0 rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold text-ink">
                  {RFQ_STATUS_LABEL[r.status] ?? r.status}
                </span>
              </Link>
            ))}
          </div>
        )}
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
