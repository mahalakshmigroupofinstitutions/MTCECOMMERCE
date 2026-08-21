import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { ShopSetupNotice } from "@/components/vendor/ShopSetupNotice";
import { ShopSetupProgress } from "@/components/vendor/ShopSetupProgress";
import { ShopSetupSteps, nextShopStep } from "@/components/vendor/ShopSetupSteps";
import { ShopStatusBadge } from "@/components/vendor/ShopStatusBadge";
import { ShopPublishPanel } from "@/components/vendor/ShopPublishPanel";
import { SHOP_STEP_META, STORE_URL_HOST } from "@/components/vendor/shopSetupMeta";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { canPublishShop, getOrCreateShop, getShopCompletion, isShopPubliclyVisible } from "@/lib/vendorShop";

export const revalidate = 0;

export default async function VendorShopSetupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    published?: string;
    hidden?: string;
    confirm?: string;
  }>;
}) {
  const { error, saved, published, hidden, confirm } = await searchParams;
  const supplier = await requireVendorForShopSetup("/vendor/shop");

  // Creates the shop on first visit through the backend's own guarded path —
  // the client never gets to create a Shop row.
  const shop = await getOrCreateShop(supplier.id);
  const [eligibility, publiclyVisible] = await Promise.all([
    canPublishShop(supplier.id),
    isShopPubliclyVisible(supplier.id),
  ]);
  const completion = getShopCompletion(shop);

  const nextStep = nextShopStep(completion);
  const isApproved = supplier.onboardingStatus === "APPROVED";

  return (
    <div className="mx-auto max-w-4xl px-6 py-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Shop Setup</h1>
          <p className="mt-1.5 max-w-xl text-[13px] text-sub">
            Complete your shop profile to prepare your storefront for buyers.
          </p>
        </div>
        <ShopStatusBadge onboardingStatus={supplier.onboardingStatus} shopStatus={shop.status} />
      </div>

      <div className="mt-6">
        <ShopSetupNotice error={error} saved={saved} published={published === "1"} hidden={hidden === "1"} />
      </div>

      {!isApproved && (
        <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-line bg-wash p-4">
          <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-sub" />
          <p className="text-[12.5px] leading-relaxed text-sub">
            Your shop can be prepared while verification is in progress, but it will remain hidden from buyers until
            approval and publishing requirements are completed.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-line p-5">
        <ShopSetupProgress completion={completion} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.6fr_1fr] md:items-start">
        <div className="rounded-2xl border border-line p-3 md:p-4">
          <h2 className="px-1 pb-2 text-[12.5px] font-bold text-ink">Setup checklist</h2>
          <ShopSetupSteps completion={completion} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line p-5">
            <h2 className="text-[12.5px] font-bold text-ink">Storefront URL</h2>
            <p className="mt-2 font-mono text-[12px] break-all text-sub">
              {STORE_URL_HOST}/supplier/{supplier.slug}
            </p>
            <p className="mt-2 text-[11.5px] text-faint">
              Your one public storefront address. Edit it in Basic information.
            </p>
          </div>

          <ShopPublishPanel
            eligibility={eligibility}
            shopStatus={shop.status}
            publiclyVisible={publiclyVisible}
            confirming={confirm === "publish"}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={`/vendor/shop/${nextStep}`} className={buttonClassName({ size: "md" })}>
          {completion.completed.length === 0 ? "Start setup" : completion.isComplete ? "Review setup" : "Continue setup"}
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </Link>
        <span className="text-[12.5px] text-sub">
          Next: <b className="text-ink">{SHOP_STEP_META[nextStep].label}</b>
        </span>
      </div>
    </div>
  );
}
