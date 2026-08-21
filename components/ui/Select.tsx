import type { SelectHTMLAttributes } from "react";
import { inputClassName } from "./Input";

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={`${inputClassName} ${className ?? ""}`}>
      {children}
    </select>
  );
}
