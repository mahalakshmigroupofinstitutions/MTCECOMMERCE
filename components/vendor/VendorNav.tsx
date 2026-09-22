"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/shop", label: "Shop" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/orders", label: "Orders" },
];

/** Desktop nav row — split out from VendorHeader (a server component fetching
 * the vendor) so it can read the current path and actually show which page is
 * active. Previously every link rendered identically regardless of route. */
export function VendorNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden h-full items-stretch gap-1 md:flex">
      {NAV_LINKS.map((link) => {
        const active = link.href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative flex items-center px-3 text-[13.5px] transition-colors ${
              active ? "font-extrabold text-accent" : "font-semibold text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.label}
            {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}
