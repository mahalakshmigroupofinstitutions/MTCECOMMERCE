import Link from "next/link";
import type { VendorActivityItem, VendorActivityType } from "@/lib/vendorActivity";

const DOT_COLOR: Record<VendorActivityType, string> = {
  product_added: "bg-purple",
  product_updated: "bg-purple",
  quote_submitted: "bg-faint",
  quote_accepted: "bg-green",
  quote_rejected: "bg-faint",
  order_advanced: "bg-blue",
  rfq_received: "bg-amber",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ActivityFeed({ items }: { items: VendorActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line p-5">
        <h2 className="text-[13.5px] font-extrabold text-ink">Recent activity</h2>
        <p className="mt-2 text-[12.5px] text-sub">Your activity will show up here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line p-5">
      <h2 className="text-[13.5px] font-extrabold text-ink">Recent activity</h2>
      <div className="mt-3 flex flex-col divide-y divide-line">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="-mx-1.5 flex items-start gap-2.5 rounded-lg px-1.5 py-2.5 transition-colors hover:bg-wash"
          >
            <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[item.type]}`} />
            <span className="flex-1 text-[13px] font-semibold text-ink">{item.title}</span>
            <span className="shrink-0 text-[11px] text-faint">{timeAgo(item.at)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
