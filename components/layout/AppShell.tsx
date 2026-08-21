import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { getCurrentBuyerId } from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const authed = Boolean(await getCurrentBuyerId());
  return (
    <div className="flex min-h-full flex-col">
      <DesktopHeader authed={authed} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  );
}
