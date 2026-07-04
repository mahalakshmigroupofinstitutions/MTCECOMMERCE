import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <DesktopHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar />
    </div>
  );
}
