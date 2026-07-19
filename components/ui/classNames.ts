/* Pure class-string helpers shared by interactive components (Button, Chip) and
 * plain <Link>s styled to match them. Kept in a non-"use client" module so Server
 * Components can call them directly. */

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid: "bg-accent text-white border border-accent hover:brightness-[1.08] hover:shadow-md hover:shadow-accent/20",
  outline: "bg-paper text-ink border border-line hover:border-ink hover:bg-wash",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-wash",
};

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-2.5 text-[13px]",
  md: "px-4.5 py-3 text-[15px]",
  lg: "px-5 py-4 text-base",
};

export function buttonClassName({
  variant = "solid",
  size = "md",
  full,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
} = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-[0.02em] transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100 disabled:hover:shadow-none ${BUTTON_VARIANT_CLASSES[variant]} ${BUTTON_SIZE_CLASSES[size]} ${full ? "w-full" : ""} ${className ?? ""}`;
}

/** Shared hover-lift treatment for clickable cards (supplier/product/category tiles). */
export const cardHoverClassName =
  "transition-all duration-200 hover:-translate-y-1 hover:border-ink/25 hover:shadow-lg hover:shadow-ink/[0.06]";

export function chipClassName({ active, className }: { active?: boolean; className?: string } = {}) {
  return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150 ${
    active ? "border-accent bg-accent text-white" : "border-line bg-paper text-ink hover:border-ink"
  } ${className ?? ""}`;
}
