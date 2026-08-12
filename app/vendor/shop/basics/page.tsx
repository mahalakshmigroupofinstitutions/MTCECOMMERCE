import { FormField, Input, Select, Textarea } from "@/components/ui";
import { ShopStepActions, ShopStepShell } from "@/components/vendor/ShopStepShell";
import { StoreUrlField } from "@/components/vendor/StoreUrlField";
import { getCategories } from "@/lib/catalog";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { getOrCreateShop, getShopCompletion } from "@/lib/vendorShop";
import { saveShopBasicsAction } from "@/app/vendor/shop/actions";

export const revalidate = 0;

export default async function ShopBasicsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supplier = await requireVendorForShopSetup("/vendor/shop/basics");

  const [shop, categories] = await Promise.all([getOrCreateShop(supplier.id), getCategories()]);
  const completion = getShopCompletion(shop);

  /* Prefill order: what the vendor saved into the shop, then what they already
   * gave during account onboarding. getOrCreateShop seeds most of this on first
   * visit; the fallbacks cover a shop created before those fields were set. */
  const supportEmail = shop.supportEmail ?? supplier.email ?? "";
  const supportPhone = shop.supportPhone ?? supplier.phone ?? "";
  const categoryId = shop.categoryId ?? supplier.businessCategoryId ?? "";

  return (
    <ShopStepShell
      step="basics"
      description="This is what buyers see first on your storefront and how they reach you."
      completion={completion}
      error={error}
      saved={saved}
    >
      {/* Posts straight to the Phase C Server Action — the page holds no
          business logic of its own. novalidate is deliberately absent so
          the browser gives immediate feedback before the round trip. */}
      <form action={saveShopBasicsAction} className="flex flex-col gap-3.5">
            <FormField htmlFor="name" label="Shop name" required hint="Shown as your storefront title.">
              <Input
                id="name"
                name="name"
                required
                maxLength={200}
                autoComplete="organization"
                placeholder="e.g. Shree Balaji Steel Industries"
                defaultValue={shop.name}
              />
            </FormField>

            <FormField htmlFor="categoryId" label="Shop category" required hint="The category buyers will find you in.">
              <Select id="categoryId" name="categoryId" required defaultValue={categoryId}>
                <option value="" disabled>
                  Choose one
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              htmlFor="description"
              label="Shop description"
              required
              hint="A short introduction to what you supply. Up to 5,000 characters."
            >
              <Textarea
                id="description"
                name="description"
                rows={5}
                required
                maxLength={5000}
                placeholder="What you manufacture or supply, the industries you serve, and what sets you apart."
                defaultValue={shop.description ?? ""}
              />
            </FormField>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <FormField htmlFor="supportEmail" label="Support email" required hint="Where buyer enquiries go.">
                <Input
                  id="supportEmail"
                  name="supportEmail"
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  placeholder="support@yourcompany.in"
                  defaultValue={supportEmail}
                />
              </FormField>

              <FormField htmlFor="supportPhone" label="Support phone" required hint="10-digit mobile, or with country code.">
                <Input
                  id="supportPhone"
                  name="supportPhone"
                  type="tel"
                  required
                  inputMode="tel"
                  pattern="[0-9+\-\s()]{8,20}"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  defaultValue={supportPhone}
                />
              </FormField>
            </div>

        <StoreUrlField defaultSlug={supplier.slug} />

        <ShopStepActions />
      </form>
    </ShopStepShell>
  );
}
