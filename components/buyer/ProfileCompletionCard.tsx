import { Icon } from "@/components/icons/Icon";
import type { ProfileCompletion } from "@/lib/buyerProfile";

/** Read-only summary driven entirely by getProfileCompletion() — nothing is
 * counted here. Rendered by the (dynamic) account page from the saved Buyer
 * row, so it reflects a save as soon as updateProfile redirects back. */
export function ProfileCompletionCard({ completion }: { completion: ProfileCompletion }) {
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-ink">Profile Completion</h2>
        <span className="font-mono text-[15px] font-extrabold text-ink">{completion.percent}%</span>
      </div>

      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-wash"
        role="progressbar"
        aria-valuenow={completion.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion"
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${completion.percent}%` }}
        />
      </div>

      <p className="mt-2 text-[12px] text-sub">
        {completion.completedCount} of {completion.totalCount} details complete
        {completion.completedCount < completion.totalCount && " · use Edit below to fill in the rest"}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {completion.sections.map((section) => (
          <div key={section.title}>
            <div className="mb-1.5 text-[12px] font-bold text-ink">{section.title}</div>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-1.5 text-[12.5px] ${item.complete ? "text-ink" : "text-faint"}`}
                >
                  <Icon name={item.complete ? "check" : "x"} size={13} />
                  <span>{item.label}</span>
                  <span className="sr-only">{item.complete ? "(complete)" : "(missing)"}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

