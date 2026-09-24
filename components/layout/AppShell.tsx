import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { getCurrentBuyer } from "@/lib/session";

export async function AppShell({ children }: { children: React.ReactNode }) {
  // One query covers both "is a buyer signed in" and, when yes, the name/
  // company the header's account menu shows — no second lookup needed.
  const buyer = await getCurrentBuyer();
  const authed = Boolean(buyer);
  return (
    <div className="flex min-h-full flex-col">
      <DesktopHeader authed={authed} buyerName={buyer?.name ?? null} buyerCompanyName={buyer?.companyName ?? null} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileTabBar authed={authed} />
    </div>
  );
}
