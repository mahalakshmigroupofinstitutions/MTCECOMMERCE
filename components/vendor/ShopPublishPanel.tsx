import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { SubmitButton, buttonClassName } from "@/components/ui";
import { publishShopAction, unpublishShopAction } from "@/app/vendor/shop/actions";
import type { PublishBlocker, PublishEligibility } from "@/lib/vendorShop";
import type { ShopStatus } from "@/lib/generated/prisma/client";

/* Publishing controls for the Shop Setup overview.
 *
 * Every requirement shown here comes from canPublishShop() — this component
 * renders the backend's blockers and never re-derives them. publishShop()
 * re-checks eligibility server-side too, so a stale page can't force a publish. */

interface BlockerCopy {
  label: string;
  fix?: { href: string; label: string };
}

const BLOCKER_COPY: Record<PublishBlocker, BlockerCopy> = {
  notApproved: { label: "Vendor verification approved", fix: { href: "/vendor/pending", label: "View status" } },
  setupIncomplete: { label: "Shop setup complete", fix: { href: "/vendor/shop", label: "Finish setup" } },
  noPublishedProduct: {
    label: "At least one published product",
    fix: { href: "/vendor/products", label: "Go to products" },
  },
};

const ORDER: PublishBlocker[] = ["notApproved", "setupIncomplete", "noPublishedProduct"];

export function ShopPublishPanel({
  eligibility,
  shopStatus,
  publiclyVisible,
  confirming,
}: {
  eligibility: PublishEligibility;
  shopStatus: ShopStatus;
  publiclyVisible: boolean;
  /** ?confirm=publish — an inline confirmation step, no modal library. */
  confirming: boolean;
}) {
  const isLive = shopStatus === "LIVE";
  const wasUnpublished = shopStatus === "HIDDEN";

  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[12.5px] font-bold text-ink">{isLive ? "Your shop is live" : "Before going live"}</h2>
        {publiclyVisible && (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Visible to buyers
          </span>
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-2.5">
        {ORDER.map((blocker) => {
          const done = !eligibility.blockers.includes(blocker);
          const copy = BLOCKER_COPY[blocker];
          return (
            <li key={blocker} className="flex items-start gap-2 text-[12.5px]">
              <span
                className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-ink text-white" : "border border-line"
                }`}
              >
                {done && <Icon name="check" size={10} strokeWidth={3} />}
              </span>
              <span className={done ? "text-ink" : "text-sub"}>{copy.label}</span>
              {!done && copy.fix && (
                <Link href={copy.fix.href} className="ml-auto shrink-0 font-semibold text-ink underline">
                  {copy.fix.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4">
        <Link
          href="/vendor/shop/preview"
          className={buttonClassName({ variant: "outline", size: "sm", full: true })}
        >
          <Icon name="search" size={15} strokeWidth={2} /> Preview shop
        </Link>

        {isLive ? (
          <form action={unpublishShopAction}>
            <SubmitButton
              pendingText="Hiding…"
              className={buttonClassName({ variant: "secondary", size: "sm", full: true })}
            >
              Unpublish shop
            </SubmitButton>
          </form>
        ) : eligibility.ok ? (
          confirming ? (
            <div className="rounded-xl border border-line bg-wash p-3.5">
              <p className="text-[12.5px] font-bold text-ink">Publish your shop?</p>
              <p className="mt-1 text-[11.5px] text-sub">
                Your shop will become visible to buyers. Products keep their own statuses — only the{" "}
                {eligibility.publishedProducts} you&rsquo;ve published will appear.
              </p>
              <div className="mt-3 flex gap-2">
                <form action={publishShopAction} className="flex-1">
                  <SubmitButton
                    pendingText="Publishing…"
                    className={buttonClassName({ variant: "success", size: "sm", full: true })}
                  >
                    Publish shop
                  </SubmitButton>
                </form>
                <Link
                  href="/vendor/shop"
                  className={buttonClassName({ variant: "ghost", size: "sm", className: "flex-1" })}
                >
                  Cancel
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/vendor/shop?confirm=publish" className={buttonClassName({ variant: "success", size: "sm", full: true })}>
              {wasUnpublished ? "Republish shop" : "Publish shop"}
            </Link>
          )
        ) : (
          // No disabled-looking button that secretly does nothing — the
          // checklist above already says what's outstanding.
          <p className="text-[11.5px] text-faint">
            Publishing unlocks once every requirement above is met.
          </p>
        )}
      </div>
    </div>
  );
}
