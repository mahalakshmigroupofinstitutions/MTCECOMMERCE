"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";
import { SubmitButton, buttonClassName } from "@/components/ui";
import { logoutBuyer } from "@/app/(buyer)/account/actions";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" as const },
  { href: "/rfq", label: "My RFQs", icon: "doc" as const },
  { href: "/orders", label: "Orders", icon: "box" as const },
];

/* Deliberately excludes My RFQs / Orders — those already live in NAV_LINKS
 * above, right next to this menu, so repeating them here would just be the
 * same two links twice.
 *
 * Saved suppliers has its own dedicated page (app/(buyer)/saved-suppliers) —
 * it no longer lives on the Account page, which is profile/company fields
 * only now.
 *
 * No standalone Invoices entry: an invoice belongs to its order, not to a
 * top-level nav item. It's viewed from that order's own detail page
 * (app/(buyer)/orders/[id]/page.tsx's InvoiceCard), reached via "Orders" in
 * the main nav next to this menu. */
const PROFILE_MENU_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "My Dashboard", icon: "home" },
  { href: "/account", label: "Account details", icon: "user" },
  { href: "/saved-suppliers", label: "Saved suppliers", icon: "heart" },
];

export function DesktopHeader({
  authed,
  buyerName,
  buyerCompanyName,
}: {
  authed: boolean;
  buyerName?: string | null;
  buyerCompanyName?: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close whenever the route changes (a menu link was followed). Adjusting
  // state during render rather than in an effect, per React's own guidance —
  // an effect here would set state after the already-stale menu-open frame
  // paints, instead of before it.
  const [menuOpenedAtPathname, setMenuOpenedAtPathname] = useState(pathname);
  if (menuOpen && pathname !== menuOpenedAtPathname) {
    setMenuOpen(false);
    setMenuOpenedAtPathname(pathname);
  }

  // Close on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

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
          {authed ? (
            <div className="relative ml-1.5" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-line bg-wash text-ink"
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Icon name="user" size={18} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-line bg-paper p-2 shadow-lg shadow-ink/[0.08]"
                >
                  <div className="border-b border-line px-3 py-2.5">
                    <div className="truncate text-[13.5px] font-bold text-ink">{buyerName ?? "Your account"}</div>
                    {buyerCompanyName && (
                      <div className="mt-0.5 truncate text-[11.5px] text-sub">{buyerCompanyName}</div>
                    )}
                  </div>

                  <div className="mt-1 flex flex-col">
                    {PROFILE_MENU_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-wash"
                      >
                        <Icon name={item.icon} size={16} className="text-sub" />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-1 border-t border-line pt-1">
                    <form action={logoutBuyer}>
                      <SubmitButton
                        pendingText="Logging out…"
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-wash"
                      >
                        <Icon name="arrow-left" size={16} className="text-sub" /> Logout
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="ml-1.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold text-ink">
                Log in
              </Link>
              <Link href="/register" className={buttonClassName({ variant: "outline", size: "sm" })}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
