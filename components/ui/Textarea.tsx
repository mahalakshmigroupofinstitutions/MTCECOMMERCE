import type { TextareaHTMLAttributes } from "react";
import { inputClassName } from "./Input";

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${inputClassName} resize-none ${className ?? ""}`} />;
}
