"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/vendor", label: "Dashboard", icon: "home" },
  { href: "/vendor/rfqs", label: "RFQs", icon: "doc" },
  { href: "/vendor/shop", label: "Shop", icon: "store" },
  { href: "/vendor/products", label: "Products", icon: "box" },
  { href: "/vendor/orders", label: "Orders", icon: "truck" },
];

/** Mobile counterpart to VendorHeader's desktop nav row (hidden below md).
 * Mirrors components/layout/MobileTabBar.tsx's pattern on the buyer side. */
export function VendorTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex bg-ink pt-2 pb-1.5 shadow-[0_-2px_8px_rgba(0,0,0,0.15)] md:hidden">
      {TABS.map((tab) => {
        const active = tab.href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-0.5 transition-colors ${active ? "text-accent" : "text-white/45"}`}
          >
            {active && <span className="absolute -top-2 h-0.5 w-8 rounded-full bg-accent" />}
            <Icon name={tab.icon} size={21} strokeWidth={active ? 2.1 : 1.7} />
            <span className={`text-[10.5px] ${active ? "font-extrabold" : "font-semibold"}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
