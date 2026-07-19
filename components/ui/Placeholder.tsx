/* Warm gradient placeholder with a mono caption — stand-in for product/supplier imagery until real photos exist. */

/** Shared warm gradient — also used as the fallback base behind a real photo in CatalogImage. */
export const PLACEHOLDER_GRADIENT = "linear-gradient(135deg, #F6F5F2 0%, #EEEAE3 45%, #F2E6D9 100%)";

export interface PlaceholderProps {
  label: string;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function Placeholder({ label, height = 160, rounded = true, className }: PlaceholderProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-line ${rounded ? "rounded-2xl" : ""} ${className ?? ""}`}
      style={{
        height,
        background: PLACEHOLDER_GRADIENT,
      }}
    >
      <span className="rounded-md border border-line bg-wash/80 px-2.5 py-1 font-mono text-[10.5px] tracking-wider text-faint uppercase backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
