/* Catch-all for Shop Setup steps whose UI hasn't been built yet. A static
 * segment always wins over this dynamic one, so each future step simply gets
 * its own folder (app/vendor/shop/delivery/page.tsx, …) and takes over — no
 * change needed here. Unknown slugs 404 rather than rendering a fake step. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { buttonClassName } from "@/components/ui";
import { ShopStepShell } from "@/components/vendor/ShopStepShell";
import { SHOP_STEP_META } from "@/components/vendor/shopSetupMeta";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { SHOP_SETUP_STEPS, getOrCreateShop, getShopCompletion, type ShopSetupStep } from "@/lib/vendorShop";

export const revalidate = 0;

export default async function ShopStepPlaceholderPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ step: rawStep }, { error, saved }] = await Promise.all([params, searchParams]);

  const step = SHOP_SETUP_STEPS.find((s) => s === rawStep) as ShopSetupStep | undefined;
  if (!step) notFound();

  const supplier = await requireVendorForShopSetup(`/vendor/shop/${step}`);
  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);
  const meta = SHOP_STEP_META[step];

  return (
    <ShopStepShell step={step} description={meta.description} completion={completion} error={error} saved={saved}>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-wash px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-paper text-ink">
          <Icon name={meta.icon} size={24} />
        </div>
        <h2 className="text-[15px] font-extrabold text-ink">This step is coming next</h2>
        <p className="max-w-sm text-[12.5px] text-sub">
          {meta.label} isn&rsquo;t available to edit yet. Anything you&rsquo;ve already saved is safe, and this step
          will open in an upcoming release.
        </p>
        <Link href="/vendor/shop" className={`${buttonClassName({ variant: "outline", size: "sm" })} mt-1`}>
          Back to Shop Setup
        </Link>
      </div>
    </ShopStepShell>
  );
}
