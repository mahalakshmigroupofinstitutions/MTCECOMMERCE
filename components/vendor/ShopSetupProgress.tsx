import { ACTIVE_SHOP_STEPS, type ShopCompletion } from "@/lib/vendorShop";

/** Progress bar driven entirely by getShopCompletion() — nothing here is
 * hardcoded or counted in the UI. The denominator is the active scope, so steps
 * on hold neither inflate nor deflate the vendor's progress. */
export function ShopSetupProgress({ completion }: { completion: ShopCompletion }) {
  const total = ACTIVE_SHOP_STEPS.length;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-bold text-ink">Setup progress</span>
        <span className="font-mono text-[15px] font-extrabold text-ink">{completion.percent}%</span>
      </div>

      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-wash"
        role="progressbar"
        aria-valuenow={completion.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Shop setup completion"
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${completion.percent}%` }}
        />
      </div>

      <p className="mt-2 text-[12px] text-sub">
        {completion.completed.length} of {total} steps complete
        {completion.missingRequired.length > 0 && (
          <>
            {" · "}
            {completion.missingRequired.length} required{" "}
            {completion.missingRequired.length === 1 ? "step" : "steps"} left
          </>
        )}
      </p>
    </div>
  );
}
