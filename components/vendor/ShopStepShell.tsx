import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons/Icon";
import { SubmitButton, buttonClassName, type ButtonVariant } from "@/components/ui";
import { ShopSetupNotice } from "./ShopSetupNotice";
import { ShopSetupSteps } from "./ShopSetupSteps";
import { SHOP_STEP_META } from "./shopSetupMeta";
import type { ShopCompletion, ShopSetupStep } from "@/lib/vendorShop";

/** Shared frame for every Shop Setup step page: back link, heading, the
 * error/success notice, and the sticky step sidebar. Purely structural — the
 * markup is lifted verbatim from the D1 Basics page so all step pages stay
 * pixel-identical as more of them land. */
export function ShopStepShell({
  step,
  description,
  completion,
  error,
  saved,
  children,
}: {
  step: ShopSetupStep;
  description: string;
  completion: ShopCompletion;
  error?: string;
  saved?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-6 md:py-8">
      <Link href="/vendor/shop" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sub">
        <Icon name="arrow-left" size={14} strokeWidth={2} /> Back to Shop Setup
      </Link>

      <div className="mt-3 grid gap-6 md:grid-cols-[1fr_230px] md:items-start">
        <div className="md:order-1">
          <h1 className="text-xl font-extrabold text-ink">{SHOP_STEP_META[step].label}</h1>
          <p className="mt-1.5 text-[13px] text-sub">{description}</p>

          <div className="mt-5">
            <ShopSetupNotice error={error} saved={saved} />
          </div>

          {children}
        </div>

        <aside className="md:order-2 md:sticky md:top-20">
          <div className="rounded-2xl border border-line p-2.5">
            <h2 className="px-1.5 pb-1.5 text-[11.5px] font-bold tracking-wide text-faint uppercase">Setup steps</h2>
            <ShopSetupSteps completion={completion} current={step} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** The Save & continue / Save & finish later pair every step form ends with.
 * `intent` is what actions.ts reads to pick the redirect target. */
export function ShopStepActions() {
  return (
    <div className="mt-2 flex flex-col gap-3 sm:flex-row-reverse sm:items-center">
      <ShopStepSubmit intent="continue" variant="success">
        Save &amp; continue
      </ShopStepSubmit>
      <ShopStepSubmit intent="save" variant="secondary">
        Save &amp; finish later
      </ShopStepSubmit>
      <span className="text-[11.5px] text-faint sm:mr-auto">
        Your progress is saved — you can come back to this any time.
      </span>
    </div>
  );
}

function ShopStepSubmit({
  intent,
  variant,
  children,
}: {
  intent: "continue" | "save";
  variant: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <SubmitButton
      name="intent"
      value={intent}
      pendingText="Saving…"
      className={buttonClassName({ variant, size: "md", className: "w-full sm:w-auto" })}
    >
      {children}
    </SubmitButton>
  );
}
