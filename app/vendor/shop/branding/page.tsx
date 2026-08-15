import { BrandColorField } from "@/components/vendor/BrandColorField";
import { ShopImageField } from "@/components/vendor/ShopImageField";
import { ShopStepActions, ShopStepShell } from "@/components/vendor/ShopStepShell";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { getOrCreateShop, getShopCompletion } from "@/lib/vendorShop";
import { saveShopBrandingAction } from "@/app/vendor/shop/actions";

export const revalidate = 0;

export default async function ShopBrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supplier = await requireVendorForShopSetup("/vendor/shop/branding");

  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);

  return (
    <ShopStepShell
      step="branding"
      description="Your logo and cover image are the first thing buyers see on your storefront."
      completion={completion}
      error={error}
      saved={saved}
    >
      {/* Next renders Server Action forms as multipart/form-data, and
          next.config sets serverActions.bodySizeLimit to 10mb, so the 5 MB
          per-image ceiling is the binding limit. */}
      <form action={saveShopBrandingAction} className="flex flex-col gap-4">
        <ShopImageField
          name="logo"
          removeName="removeLogo"
          label="Shop logo"
          hint="Square works best."
          currentUrl={shop.logoUrl}
          previewLabel="No logo yet"
          previewHeight={140}
        />

        <ShopImageField
          name="banner"
          removeName="removeBanner"
          label="Cover image"
          hint="A wide banner across the top of your storefront."
          currentUrl={shop.bannerUrl}
          previewLabel="No cover image yet"
          previewHeight={170}
        />

        <BrandColorField defaultColor={shop.brandColor} />

        <p className="text-[11.5px] text-faint">
          Only a logo is required to complete this step — the cover image and brand colour are optional.
        </p>

        <ShopStepActions />
      </form>
    </ShopStepShell>
  );
}
