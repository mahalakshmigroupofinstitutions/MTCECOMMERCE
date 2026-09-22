import { Icon, type IconName } from "@/components/icons/Icon";

export type StatAccent = "blue" | "green" | "amber" | "purple";

const ACCENT_BG: Record<StatAccent, string> = {
  blue: "bg-blue",
  green: "bg-green",
  amber: "bg-amber",
  purple: "bg-purple",
};

const ACCENT_TEXT: Record<StatAccent, string> = {
  blue: "text-blue",
  green: "text-green",
  amber: "text-amber",
  purple: "text-purple",
};

export interface StatCardProps {
  icon: IconName;
  accent: StatAccent;
  value: string;
  label: string;
  sub?: string;
  /** Color the sub-metric with the accent instead of neutral gray — reserve
   * for genuinely urgent/positive sub-metrics (e.g. "expiring soon"), not
   * routine ones, so color keeps meaning instead of decorating every card. */
  subUrgent?: boolean;
}

/** Like components/ui/Metric.tsx, but with room for a sub-metric line
 * (spec 2.6 wants two numbers per card, e.g. "Pending" + "Expired"). Neutral
 * card body — color lives only in the small icon chip and, where earned, the
 * sub-metric text. */
export function StatCard({ icon, accent, value, label, sub, subUrgent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line p-3.5">
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENT_BG[accent]}`}>
        <Icon name={icon} size={15} strokeWidth={2} className="text-white" />
      </div>
      <div>
        <div className="font-mono text-[20px] font-extrabold leading-none text-ink">{value}</div>
        <div className="mt-1.5 text-[11.5px] font-bold text-ink">{label}</div>
        {sub && (
          <div className={`mt-0.5 text-[10.5px] font-semibold ${subUrgent ? ACCENT_TEXT[accent] : "text-sub"}`}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
