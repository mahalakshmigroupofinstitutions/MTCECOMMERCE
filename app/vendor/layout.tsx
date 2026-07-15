import { VendorHeader } from "@/components/vendor/VendorHeader";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <VendorHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
