import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { getCurrentVendor } from "@/lib/vendorSession";
import { vendorLogout } from "@/app/vendor/actions";

const NAV_LINKS = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/rfqs", label: "RFQs" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/orders", label: "Orders" },
];

export async function VendorHeader() {
  const vendor = await getCurrentVendor();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/vendor" className="flex items-center gap-2.5">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-ink text-base font-extrabold text-white">
            N
          </span>
          <span className="text-[15px] font-extrabold tracking-tight text-ink">
            NextGen <span className="text-sub">Vendor</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {vendor ? (
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12.5px] font-semibold text-sub">
              Buyer site
            </Link>
            <span className="hidden text-[13px] font-bold text-ink sm:inline">{vendor.name}</span>
            <form action={vendorLogout}>
              <button type="submit" className={buttonClassName({ variant: "outline", size: "sm" })}>
                <Icon name="arrow-left" size={14} strokeWidth={2} /> Log out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/vendor/login" className={buttonClassName({ size: "sm" })}>
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
