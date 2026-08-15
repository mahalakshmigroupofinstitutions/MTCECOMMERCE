import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { ACTIVE_SHOP_STEPS, REQUIRED_SHOP_STEPS, type ShopCompletion, type ShopSetupStep } from "@/lib/vendorShop";
import { SHOP_STEP_META } from "./shopSetupMeta";

/* The checklist walks ACTIVE_SHOP_STEPS, so a step put on hold in
 * lib/vendorShop.ts disappears from the wizard without any edit here. */

/** A step opens once it's already complete, or once every required step before
 * it is done — so the wizard reads in order without trapping a vendor who wants
 * to revisit something. Derived from persisted completion, never from where the
 * vendor has clicked. */
export function unlockedSteps(completion: ShopCompletion): Set<ShopSetupStep> {
  const unlocked = new Set<ShopSetupStep>();
  let priorRequiredDone = true;

  for (const step of ACTIVE_SHOP_STEPS) {
    if (completion.steps[step] || priorRequiredDone) unlocked.add(step);
    if (REQUIRED_SHOP_STEPS.includes(step) && !completion.steps[step]) priorRequiredDone = false;
  }

  return unlocked;
}

/** The first required step still outstanding — what "Continue setup" targets. */
export function nextShopStep(completion: ShopCompletion): ShopSetupStep {
  return completion.missingRequired[0] ?? ACTIVE_SHOP_STEPS.find((s) => !completion.steps[s]) ?? "basics";
}

/** `compact` drops the per-step descriptions — used by the narrow sidebar on a
 * step page, where the heading already says where you are. */
export function ShopSetupSteps({
  completion,
  current,
  compact,
}: {
  completion: ShopCompletion;
  current?: ShopSetupStep;
  compact?: boolean;
}) {
  const unlocked = unlockedSteps(completion);

  return (
    <ol className="flex flex-col">
      {ACTIVE_SHOP_STEPS.map((step, index) => {
        const meta = SHOP_STEP_META[step];
        const done = completion.steps[step];
        const isCurrent = step === current;
        const isOpen = unlocked.has(step);
        const optional = !REQUIRED_SHOP_STEPS.includes(step);

        const body = (
          <>
            <span
              className={`flex shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                compact ? "h-6.5 w-6.5 text-[11px]" : "h-8 w-8"
              } ${
                done
                  ? "bg-ink text-white"
                  : isCurrent
                    ? "border-2 border-ink text-ink"
                    : "border border-line text-faint"
              }`}
            >
              {done ? <Icon name="check" size={compact ? 12 : 14} strokeWidth={2.5} /> : index + 1}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={`${compact ? "text-[12.5px]" : "text-[13.5px]"} font-bold ${isOpen ? "text-ink" : "text-faint"}`}
                >
                  {meta.label}
                </span>
                {optional && !compact && <span className="text-[11px] font-semibold text-faint">Optional</span>}
              </span>
              {!compact && <span className="mt-0.5 block truncate text-[12px] text-sub">{meta.description}</span>}
            </span>

            {/* In compact mode the muted label already reads as unavailable. */}
            {!compact &&
              (isOpen ? (
                <Icon name="chevron-right" size={16} className="shrink-0 text-faint" />
              ) : (
                <span className="shrink-0 text-[11px] font-semibold text-faint">Locked</span>
              ))}
          </>
        );

        const rowClass = `flex items-center rounded-xl border ${
          compact ? "gap-2.5 px-2.5 py-2" : "gap-3.5 px-3.5 py-3"
        } ${isCurrent ? "border-ink bg-wash" : "border-transparent"}`;

        return (
          <li key={step}>
            {isOpen ? (
              <Link href={`/vendor/shop/${step}`} className={`${rowClass} transition-colors hover:bg-wash`}>
                {body}
              </Link>
            ) : (
              <div className={`${rowClass} cursor-not-allowed opacity-70`} aria-disabled="true">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
