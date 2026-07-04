/* Striped placeholder box with a mono caption — stand-in for product/supplier imagery until real photos exist. */
export interface PlaceholderProps {
  label: string;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function Placeholder({ label, height = 160, rounded = true, className }: PlaceholderProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-line bg-[repeating-linear-gradient(135deg,#F0EFEB,#F0EFEB_7px,#E7E6E1_7px,#E7E6E1_8px)] ${rounded ? "rounded-2xl" : ""} ${className ?? ""}`}
      style={{ height }}
    >
      <span className="rounded-md border border-line bg-wash px-2.5 py-1 font-mono text-[10.5px] tracking-wider text-faint uppercase">
        {label}
      </span>
    </div>
  );
}
