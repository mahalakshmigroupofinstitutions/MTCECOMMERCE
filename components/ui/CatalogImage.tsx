import Image from "next/image";
import { Placeholder, PLACEHOLDER_GRADIENT } from "./Placeholder";

/* Renders a real catalog photo (product/supplier) via next/image. The warm
 * gradient sits behind it as the graceful fallback: with no src we show the
 * labelled Placeholder, and if the photo fails to load the gradient shows
 * through. Drop-in superset of Placeholder's props. */
export interface CatalogImageProps {
  src?: string | null;
  label: string;
  height?: number;
  rounded?: boolean;
  sizes?: string;
  className?: string;
}

export function CatalogImage({
  src,
  label,
  height = 160,
  rounded = true,
  sizes = "(max-width: 640px) 100vw, 320px",
  className,
}: CatalogImageProps) {
  if (!src) {
    return <Placeholder label={label} height={height} rounded={rounded} className={className} />;
  }

  return (
    <div
      className={`relative overflow-hidden border border-line ${rounded ? "rounded-2xl" : ""} ${className ?? ""}`}
      style={{ height, background: PLACEHOLDER_GRADIENT }}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}
