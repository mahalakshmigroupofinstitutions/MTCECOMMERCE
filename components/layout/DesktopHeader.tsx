"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";

const NAV_LINKS = [
  { href: "/rfq", label: "My RFQs", icon: "doc" as const },
  { href: "/orders", label: "Orders", icon: "box" as const },
];

export function DesktopHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 hidden border-b border-line bg-paper md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-accent text-base font-extrabold text-white">
            N
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink">NextGen</span>
        </Link>

        <Link
          href="/search"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-wash px-4 py-2.5 text-sub transition-colors hover:border-ink/25 hover:bg-paper"
        >
          <Icon name="search" size={18} className="flex-shrink-0 text-faint" />
          <span className="truncate text-left text-[13.5px]">Search products, suppliers, categories&hellip;</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold ${
                pathname === link.href ? "bg-wash text-ink" : "text-ink"
              }`}
            >
              <Icon name={link.icon} size={18} />
              {link.label}
            </Link>
          ))}
          <button className="relative rounded-lg px-3 py-2 text-ink" aria-label="Notifications">
            <Icon name="bell" size={18} />
            <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-ink" />
          </button>
          <Link href="/vendor" className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-sub">
            Sell on NextGen
          </Link>
          <div className="mx-1.5 h-6.5 w-px bg-line" />
          <Link href="/rfq/new" className={buttonClassName({ size: "sm" })}>
            <Icon name="plus" size={18} strokeWidth={2} />
            Post RFQ
          </Link>
          <Link
            href="/account"
            className="ml-1.5 flex h-8.5 w-8.5 items-center justify-center rounded-full border border-line bg-wash text-ink"
            aria-label="Account"
          >
            <Icon name="user" size={18} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
