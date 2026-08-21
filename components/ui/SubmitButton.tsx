"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

export interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
}

/** Must be rendered as a descendant of a <form> — useFormStatus reads the nearest
 * parent form's pending state. Disables itself during submission so a double-click
 * (or an impatient second click while a Server Action is in flight) can't fire the
 * same mutation twice. */
export function SubmitButton({ children, pendingText, disabled, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} {...rest}>
      {pending ? (pendingText ?? "Submitting…") : children}
    </button>
  );
}
