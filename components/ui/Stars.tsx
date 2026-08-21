import { Icon } from "@/components/icons/Icon";

export interface StarsProps {
  value: number;
  size?: number;
}

export function Stars({ value, size = 12 }: StarsProps) {
  return (
    <span className="inline-flex items-center gap-1 text-ink">
      <Icon name="star" size={size} />
      <span className="font-bold" style={{ fontSize: size + 1 }}>
        {value.toFixed(1)}
      </span>
    </span>
  );
}
