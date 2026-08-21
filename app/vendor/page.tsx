import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { ProfileSummaryCard } from "@/components/vendor/ProfileSummaryCard";
import { StatCard } from "@/components/vendor/StatCard";
import { DealPipeline } from "@/components/vendor/DealPipeline";
import { ActionQueue } from "@/components/vendor/ActionQueue";
import { ActivityFeed } from "@/components/vendor/ActivityFeed";
import { getCurrentSupplierId, getCurrentVendor } from "@/lib/vendorSession";
import {
  getVendorDashboardStats,
  getDealPipeline,
  getActionQueue,
  getVendorProfileCompletion,
  hasVendorProducts,
} from "@/lib/vendorDashboard";
import { getVendorActivity } from "@/lib/vendorActivity";
import { ONBOARDING_STEPS } from "@/lib/vendorOnboarding";

export const revalidate = 0;

export default async function VendorDashboardPage() {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor");

  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/vendor/login?next=/vendor");
  if (vendor.onboardingStatus === "DRAFT") {
    redirect(`/vendor/onboarding/${ONBOARDING_STEPS[vendor.onboardingStep] ?? "business"}`);
  }

  const [stats, pipeline, actionItems, activity, hasProducts] = await Promise.all([
    getVendorDashboardStats(supplierId),
    getDealPipeline(supplierId),
    getActionQueue(supplierId),
    getVendorActivity(supplierId),
    hasVendorProducts(supplierId),
  ]);

  const completion = getVendorProfileCompletion(vendor);
  const completeHref =
    vendor.onboardingStatus === "APPROVED" ? "/vendor/shop" : `/vendor/onboarding/${ONBOARDING_STEPS[vendor.onboardingStep] ?? "business"}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6 md:py-8">
      <ProfileSummaryCard
        name={vendor.name}
        city={vendor.city}
        verified={vendor.verified}
        completionPercent={completion.percent}
        completeHref={completeHref}
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon="star" accent="purple" value={stats.trust.score.toFixed(1)} label="Trust score" sub={`${stats.trust.reviews} reviews`} />
        <StatCard icon="doc" accent="blue" value={String(stats.rfqs.total)} label="RFQs received" sub={`${stats.rfqs.newToday} new today`} />
        <StatCard
          icon="clock"
          accent="amber"
          value={String(stats.quotes.pending)}
          label="Quotes pending"
          sub={`${stats.quotes.expiring} expiring soon`}
          subUrgent={stats.quotes.expiring > 0}
        />
        <StatCard icon="box" accent="green" value={String(stats.orders.active)} label="Active orders" sub={`${stats.orders.shipped} shipped`} />
      </div>

      {!hasProducts && (
        <div className="mt-7 rounded-2xl border border-line bg-wash p-5">
          <p className="text-[13.5px] font-bold text-ink">Add your first product to start receiving RFQs</p>
          <p className="mt-1 text-[12.5px] text-sub">
            Buyers can only send you requests for quotes on products you&rsquo;ve listed.
          </p>
          <Link href="/vendor/products/new" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-ink underline">
            <Icon name="plus" size={14} strokeWidth={2} /> Add a product
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <DealPipeline stages={pipeline} />
          <ActionQueue items={actionItems} />
        </div>
        <ActivityFeed items={activity} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/vendor/rfqs" className="rounded-2xl border border-line p-5 transition-colors hover:bg-wash">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue">
            <Icon name="doc" size={18} strokeWidth={2} className="text-white" />
          </div>
          <div className="mt-3 font-extrabold text-ink">RFQ inbox</div>
          <div className="mt-1 text-[12.5px] text-sub">See and respond to buyer requests</div>
        </Link>
        <Link href="/vendor/products" className="rounded-2xl border border-line p-5 transition-colors hover:bg-wash">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple">
            <Icon name="box" size={18} strokeWidth={2} className="text-white" />
          </div>
          <div className="mt-3 font-extrabold text-ink">Products</div>
          <div className="mt-1 text-[12.5px] text-sub">Manage your catalog</div>
        </Link>
        <Link href="/vendor/orders" className="rounded-2xl border border-line p-5 transition-colors hover:bg-wash">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green">
            <Icon name="truck" size={18} strokeWidth={2} className="text-white" />
          </div>
          <div className="mt-3 font-extrabold text-ink">Orders</div>
          <div className="mt-1 text-[12.5px] text-sub">Track fulfillment</div>
        </Link>
      </div>
    </div>
  );
}
