import type { InputHTMLAttributes } from "react";

export function FileInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      type="file"
      className={`w-full rounded-xl border border-dashed border-line bg-wash px-3.5 py-3 text-[12.5px] text-sub outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-[12.5px] file:font-bold file:text-white ${className ?? ""}`}
    />
  );
}
