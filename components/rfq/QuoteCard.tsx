import { Icon } from "@/components/icons/Icon";
import { Stars, VerifiedBadge, buttonClassName, SubmitButton } from "@/components/ui";
import { acceptQuoteAction, rejectQuoteAction } from "@/app/(buyer)/rfq/actions";
import type { RfqWithQuotes } from "@/lib/rfq";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-wash text-ink",
  ACCEPTED: "bg-ink text-white",
  REJECTED: "bg-wash text-faint line-through",
};

export function QuoteCard({
  quote,
  rfqId,
  isLowestPrice,
  canAct,
}: {
  quote: RfqWithQuotes["quotes"][number];
  rfqId: string;
  isLowestPrice: boolean;
  canAct: boolean;
}) {
  const { supplier } = quote;

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-ink">{supplier.name}</span>
            <VerifiedBadge show={supplier.verified} small />
            {isLowestPrice && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-extrabold text-white">
                Lowest price
              </span>
            )}
            {quote.best && (
              <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-extrabold text-ink">
                Recommended
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[12px] text-sub">
            <Stars value={supplier.trustScore} size={12} />
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={12} />
              {supplier.city.split(",")[0]}
            </span>
          </div>
        </div>
        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${STATUS_STYLE[quote.status] ?? ""}`}>
          {quote.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div className="font-mono text-[15px] font-extrabold text-ink">
            ₹{quote.price.toLocaleString("en-IN")}
            <span className="text-[10px] font-semibold text-sub">/{quote.unit}</span>
          </div>
          <div className="text-[10.5px] text-sub">Price</div>
        </div>
        {quote.moq && (
          <div>
            <div className="text-[13px] font-bold text-ink">{quote.moq}</div>
            <div className="text-[10.5px] text-sub">MOQ</div>
          </div>
        )}
        {quote.delivery && (
          <div>
            <div className="text-[13px] font-bold text-ink">{quote.delivery}</div>
            <div className="text-[10.5px] text-sub">Delivery</div>
          </div>
        )}
        {quote.payment && (
          <div>
            <div className="text-[13px] font-bold text-ink">{quote.payment}</div>
            <div className="text-[10.5px] text-sub">Payment</div>
          </div>
        )}
      </div>

      {quote.note && <p className="mt-3 text-[12.5px] text-sub">{quote.note}</p>}

      {canAct && quote.status === "PENDING" && (
        <div className="mt-4 flex gap-2.5">
          <form action={acceptQuoteAction} className="flex-1">
            <input type="hidden" name="rfqId" value={rfqId} />
            <input type="hidden" name="quoteId" value={quote.id} />
            <SubmitButton pendingText="Accepting…" className={buttonClassName({ size: "sm", full: true })}>
              Accept quote
            </SubmitButton>
          </form>
          <form action={rejectQuoteAction} className="flex-1">
            <input type="hidden" name="rfqId" value={rfqId} />
            <input type="hidden" name="quoteId" value={quote.id} />
            <SubmitButton
              pendingText="Rejecting…"
              className={buttonClassName({ variant: "outline", size: "sm", full: true })}
            >
              Reject
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
