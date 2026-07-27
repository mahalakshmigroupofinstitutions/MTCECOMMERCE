import type { ReactNode } from "react";

export interface FormFieldProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ htmlFor, label, required, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-1 text-[12.5px] font-bold text-ink">
        {label}
        {required && <span className="text-accent">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-faint">{hint}</p>}
    </div>
  );
}
