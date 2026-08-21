import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-2xl px-6 py-10">{children}</div>;
}
