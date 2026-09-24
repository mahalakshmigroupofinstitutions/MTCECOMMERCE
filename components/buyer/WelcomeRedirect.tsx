"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Renders nothing — just waits briefly, then navigates on. The delay is UX
 * only (long enough to read "Welcome, {name}!"); the server has already
 * created the session by the time this page renders, so there's no auth work
 * happening here, just a short pause before landing on the real destination. */
export function WelcomeRedirect({ to, delayMs = 1400 }: { to: string; delayMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.replace(to), delayMs);
    return () => clearTimeout(timer);
  }, [to, delayMs, router]);

  return null;
}
