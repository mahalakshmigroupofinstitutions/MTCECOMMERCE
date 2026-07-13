/* Pure class-string helpers shared by interactive components (Button, Chip) and
 * plain <Link>s styled to match them. Kept in a non-"use client" module so Server
 * Components can call them directly. */

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid: "bg-accent text-white border border-accent",
  outline: "bg-paper text-ink border border-line",
  ghost: "bg-transparent text-ink border border-transparent",
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
  return `inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-[0.02em] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANT_CLASSES[variant]} ${BUTTON_SIZE_CLASSES[size]} ${full ? "w-full" : ""} ${className ?? ""}`;
}

export function chipClassName({ active, className }: { active?: boolean; className?: string } = {}) {
  return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold ${
    active ? "border-accent bg-accent text-white" : "border-line bg-paper text-ink"
  } ${className ?? ""}`;
}
