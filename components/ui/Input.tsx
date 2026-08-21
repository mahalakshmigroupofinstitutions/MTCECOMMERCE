import type { InputHTMLAttributes } from "react";

export const inputClassName =
  "w-full rounded-xl border border-line px-3.5 py-3 text-sm text-ink outline-none placeholder:text-faint focus:border-ink";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${inputClassName} ${className ?? ""}`} />;
}
