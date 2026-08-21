import { Icon } from "@/components/icons/Icon";

export interface VerifiedBadgeProps {
  show?: boolean;
  small?: boolean;
}

export function VerifiedBadge({ show = true, small = false }: VerifiedBadgeProps) {
  if (!show) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink font-bold text-white ${
        small ? "py-0.5 pr-1.5 pl-1 text-[10px]" : "py-1 pr-2 pl-1.5 text-[11px]"
      }`}
    >
      <Icon name="verified" size={small ? 11 : 13} strokeWidth={2} />
      Verified
    </span>
  );
}
