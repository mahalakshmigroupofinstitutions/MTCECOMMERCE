import Link from "next/link";
import { Icon, type IconName } from "@/components/icons/Icon";
import type { ActionItem } from "@/lib/vendorDashboard";

const ACTION_META: Record<string, { icon: IconName; bg: string }> = {
  "stale-rfqs": { icon: "clock", bg: "bg-amber" },
  "expiring-quotes": { icon: "doc", bg: "bg-amber" },
  dispatch: { icon: "truck", bg: "bg-blue" },
  "low-stock": { icon: "box", bg: "bg-red" },
};
const DEFAULT_META = { icon: "doc" as IconName, bg: "bg-blue" };

/** What's blocking the vendor's money right now, one tap from resolution.
 * Replaces a static "Quick Actions" list with something that actually reduces
 * clicks the way the spec's own stated objective asks for. Rows stay neutral;
 * color lives only in each item's icon chip. */
export function ActionQueue({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line p-5">
        <h2 className="text-[13.5px] font-extrabold text-ink">Needs your attention</h2>
        <p className="mt-2 text-[12.5px] text-sub">Nothing is blocking you right now — you&rsquo;re all caught up.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line p-5">
      <h2 className="text-[13.5px] font-extrabold text-ink">Needs your attention</h2>
      <div className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const meta = ACTION_META[item.key] ?? DEFAULT_META;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 rounded-xl bg-wash px-3.5 py-3 transition-colors hover:bg-line/50"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                <Icon name={meta.icon} size={16} strokeWidth={2} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-ink">{item.title}</div>
                <div className="mt-0.5 text-[11.5px] text-sub">{item.detail}</div>
              </div>
              <Icon name="chevron-right" size={16} className="shrink-0 text-faint" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
