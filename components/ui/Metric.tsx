import { Icon, type IconName } from "@/components/icons/Icon";

export interface MetricProps {
  icon: IconName;
  value: string;
  label: string;
}

export function Metric({ icon, value, label }: MetricProps) {
  return (
    <div className="flex-1 py-0.5 text-center">
      <div className="mb-1.5 flex justify-center text-ink">
        <Icon name={icon} size={18} />
      </div>
      <div className="font-mono text-[15px] font-extrabold text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] text-sub">{label}</div>
    </div>
  );
}
