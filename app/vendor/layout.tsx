import { VendorHeader } from "@/components/vendor/VendorHeader";
import { VendorTabBar } from "@/components/vendor/VendorTabBar";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <VendorHeader />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <VendorTabBar />
    </div>
  );
}
