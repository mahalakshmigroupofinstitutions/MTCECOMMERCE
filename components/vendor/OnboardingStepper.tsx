import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { ONBOARDING_STEPS, type OnboardingStepSlug } from "@/lib/vendorOnboarding";

const STEP_LABELS: Record<OnboardingStepSlug, string> = {
  business: "Business",
  documents: "Documents",
  bank: "Bank details",
  review: "Review",
};

export function OnboardingStepper({ current }: { current: OnboardingStepSlug }) {
  const currentIndex = ONBOARDING_STEPS.indexOf(current);

  return (
    <ol className="flex items-center">
      {ONBOARDING_STEPS.map((slug, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const circle = (
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
              isDone ? "bg-ink text-white" : isCurrent ? "border-2 border-ink text-ink" : "border border-line text-faint"
            }`}
          >
            {isDone ? <Icon name="check" size={13} strokeWidth={2.5} /> : index + 1}
          </span>
        );

        return (
          <li key={slug} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              {isDone ? (
                <Link href={`/vendor/onboarding/${slug}`}>{circle}</Link>
              ) : (
                circle
              )}
              <span className={`text-[11px] font-semibold ${isCurrent ? "text-ink" : "text-faint"}`}>
                {STEP_LABELS[slug]}
              </span>
            </div>
            {index < ONBOARDING_STEPS.length - 1 && (
              <div className={`mx-2 mb-4 h-px flex-1 ${isDone ? "bg-ink" : "bg-line"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
