"use client";

import type { ButtonHTMLAttributes } from "react";
import { chipClassName } from "./classNames";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, children, ...rest }: ChipProps) {
  return (
    <button {...rest} className={chipClassName({ active, className })}>
      {children}
    </button>
  );
}
