import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { getCurrentBuyerId } from "@/lib/session";
import { getRfqsForBuyer } from "@/lib/rfq";

export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Awaiting quotes",
  QUOTED: "Quotes received",
  CLOSED: "Order placed",
};

export default async function RfqListPage() {
  const buyerId = await getCurrentBuyerId();

  if (!buyerId) {
    redirect(`/login?next=${encodeURIComponent("/rfq")}`);
  }

  const rfqs = await getRfqsForBuyer(buyerId);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-ink">My RFQs</h1>
        <Link href="/rfq/new" className={buttonClassName({ size: "sm" })}>
          <Icon name="plus" size={16} strokeWidth={2} /> New RFQ
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <div className="rounded-2xl border border-line p-10 text-center">
          <p className="text-sm text-sub">You haven&rsquo;t requested any quotes yet.</p>
          <Link href="/rfq/new" className={`${buttonClassName({ size: "sm" })} mt-4 inline-flex`}>
            <Icon name="plus" size={16} strokeWidth={2} /> Post your first RFQ
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((r) => (
            <Link
              key={r.id}
              href={`/rfq/${r.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4"
            >
              <div className="min-w-0">
                <div className="truncate font-bold text-ink">{r.product?.title ?? r.category?.name ?? "General requirement"}</div>
                <div className="mt-1 text-[12.5px] text-sub">
                  Qty {r.quantity} &middot; {r.quotes.length} {r.quotes.length === 1 ? "quote" : "quotes"} &middot;{" "}
                  {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
              <span className="flex-shrink-0 rounded-full bg-wash px-3 py-1.5 text-[11.5px] font-bold text-ink">
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
