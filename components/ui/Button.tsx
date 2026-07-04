"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "@/components/icons/Icon";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./classNames";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  icon?: IconName;
}

export function Button({
  variant = "solid",
  size = "md",
  full,
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button {...rest} className={buttonClassName({ variant, size, full, className })}>
      {icon && <Icon name={icon} size={18} strokeWidth={2} />}
      {children}
    </button>
  );
}
