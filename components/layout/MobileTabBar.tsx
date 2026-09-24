"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Browse", icon: "grid" },
  { href: "/rfq", label: "RFQs", icon: "doc" },
  { href: "/orders", label: "Orders", icon: "box" },
  { href: "/account", label: "Account", icon: "user" },
];

/** Signed-in buyers get /dashboard as their "Home" tab target instead of the
 * public marketplace homepage — the rest of the tab bar (5 tabs total) is
 * unchanged, and signed-out visitors still get "/" for Home. */
export function MobileTabBar({ authed }: { authed: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-paper pt-2 pb-1.5 md:hidden">
      {TABS.map((tab) => {
        const href = authed && tab.href === "/" ? "/dashboard" : tab.href;
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-0.5 ${active ? "text-accent" : "text-faint"}`}
          >
            <Icon name={tab.icon} size={21} strokeWidth={active ? 2.1 : 1.7} />
            <span className={`text-[10.5px] ${active ? "font-extrabold" : "font-semibold"}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
