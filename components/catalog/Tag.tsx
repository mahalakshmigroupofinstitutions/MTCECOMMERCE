import { Icon } from "@/components/icons/Icon";

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-wash px-2.5 py-1.5 text-[11px] font-bold text-ink">
      <Icon name="check" size={12} strokeWidth={2.4} />
      {children}
    </span>
  );
}
