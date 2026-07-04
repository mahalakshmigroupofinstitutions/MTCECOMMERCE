import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { QuoteCard } from "@/components/rfq/QuoteCard";
import { getCurrentBuyerId } from "@/lib/session";
import { getRfqWithQuotes } from "@/lib/rfq";

export const revalidate = 0;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Awaiting quotes",
  QUOTED: "Quotes received",
  CLOSED: "Order placed",
};

export default async function RfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rfq, buyerId] = await Promise.all([getRfqWithQuotes(id), getCurrentBuyerId()]);
  if (!rfq) notFound();

  const isOwner = buyerId === rfq.buyerId;
  const lowestPriceQuoteId = rfq.quotes[0]?.id;

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 md:py-8">
      <div className="mb-1 text-[12.5px] text-sub">
        <Link href="/rfq">My RFQs</Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-lg font-extrabold text-ink">
          {rfq.product?.title ?? rfq.category?.name ?? "General requirement"}
        </h1>
        <span className="flex-shrink-0 rounded-full bg-wash px-3 py-1.5 text-[11.5px] font-bold text-ink">
          {STATUS_LABEL[rfq.status] ?? rfq.status}
        </span>
      </div>
      <div className="mt-2 text-[13px] text-sub">
        Qty <b className="text-ink">{rfq.quantity}</b>
        {rfq.targetDeliveryDate && (
          <>
            {" "}
            &middot; Needed by{" "}
            <b className="text-ink">
              {rfq.targetDeliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </b>
          </>
        )}
      </div>
      {rfq.notes && <p className="mt-2 text-[13.5px] text-sub">{rfq.notes}</p>}

      {rfq.status === "CLOSED" && (
        <div className="mt-5 rounded-2xl bg-ink p-4 text-white">
          <div className="flex items-center gap-2 font-extrabold">
            <Icon name="check" size={16} strokeWidth={2.4} /> Order placed
          </div>
          <p className="mt-1 text-[13px] text-white/70">
            You accepted a quote — the order is being set up.{" "}
            <Link href="/orders" className="underline">
              Track it here
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-extrabold text-ink">
            {rfq.quotes.length === 0 ? "Waiting for quotes" : `Compare quotes · ${rfq.quotes.length}`}
          </h2>
          {rfq.status !== "CLOSED" && (
            <Link href={`/rfq/${rfq.id}/quotes/new`} className="text-[12px] font-bold text-sub">
              + Add quote (internal)
            </Link>
          )}
        </div>

        {rfq.quotes.length === 0 ? (
          <div className="rounded-2xl border border-line p-8 text-center">
            <p className="text-sm text-sub">Suppliers will contact you shortly with their best price.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rfq.quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                rfqId={rfq.id}
                isLowestPrice={q.id === lowestPriceQuoteId}
                canAct={isOwner && rfq.status !== "CLOSED"}
              />
            ))}
          </div>
        )}
      </div>

      {!isOwner && (
        <p className="mt-6 text-[12px] text-faint">
          You&rsquo;re viewing a shared RFQ link — only the requester can accept or reject quotes.
        </p>
      )}

      <Link href="/rfq/new" className={`${buttonClassName({ variant: "outline", size: "sm" })} mt-8 inline-flex`}>
        <Icon name="plus" size={16} strokeWidth={2} /> Post another RFQ
      </Link>
    </div>
  );
}
