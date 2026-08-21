/* Social Links is ON HOLD — see ON_HOLD_SHOP_STEPS in lib/vendorShop.ts. The
 * form below is kept intact and reactivates the moment "social" leaves that
 * list; until then this route sends the vendor back to the overview rather than
 * offering a step the current scope doesn't include. */
import { redirect } from "next/navigation";
import { FormField, Input } from "@/components/ui";
import { ShopStepActions, ShopStepShell } from "@/components/vendor/ShopStepShell";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { getOrCreateShop, getShopCompletion, isShopStepOnHold } from "@/lib/vendorShop";
import { saveShopSocialAction } from "@/app/vendor/shop/actions";

export const revalidate = 0;

export default async function ShopSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  if (isShopStepOnHold("social")) redirect("/vendor/shop");

  const supplier = await requireVendorForShopSetup("/vendor/shop/social");

  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);

  return (
    <ShopStepShell
      step="social"
      description="Where buyers can find and message you elsewhere. All optional — one link is enough to complete this step."
      completion={completion}
      error={error}
      saved={saved}
    >
      {/* Deliberately no website field: Business Details owns Shop.website, and
          saveShopSocial neither reads nor writes it. */}
      <form action={saveShopSocialAction} className="flex flex-col gap-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField htmlFor="linkedinUrl" label="LinkedIn" hint="Company page or profile.">
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              type="text"
              maxLength={200}
              placeholder="linkedin.com/company/yourcompany"
              defaultValue={shop.linkedinUrl ?? ""}
            />
          </FormField>

          <FormField htmlFor="facebookUrl" label="Facebook">
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="text"
              maxLength={200}
              placeholder="facebook.com/yourcompany"
              defaultValue={shop.facebookUrl ?? ""}
            />
          </FormField>

          <FormField htmlFor="instagramUrl" label="Instagram">
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="text"
              maxLength={200}
              placeholder="instagram.com/yourcompany"
              defaultValue={shop.instagramUrl ?? ""}
            />
          </FormField>

          <FormField htmlFor="youtubeUrl" label="YouTube">
            <Input
              id="youtubeUrl"
              name="youtubeUrl"
              type="text"
              maxLength={200}
              placeholder="youtube.com/@yourcompany"
              defaultValue={shop.youtubeUrl ?? ""}
            />
          </FormField>
        </div>

        {/* Stored as whatsappNumber — a phone number normalised to +91…, not a
            URL. */}
        <FormField
          htmlFor="whatsappNumber"
          label="WhatsApp"
          hint="A phone number, not a link. 10-digit mobile, or with country code."
        >
          <Input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            pattern="[0-9+\-\s()]{8,20}"
            maxLength={20}
            placeholder="98765 43210"
            defaultValue={shop.whatsappNumber ?? ""}
          />
        </FormField>

        <p className="text-[11.5px] text-faint">
          You can leave the scheme off — we&rsquo;ll add https:// for you. Your company website lives in Business
          details.
        </p>

        <ShopStepActions />
      </form>
    </ShopStepShell>
  );
}
