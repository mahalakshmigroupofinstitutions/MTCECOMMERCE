/* Delivery is ON HOLD — see ON_HOLD_SHOP_STEPS in lib/vendorShop.ts. The form
 * below is kept intact and reactivates the moment "delivery" leaves that list;
 * until then this route sends the vendor back to the overview rather than
 * offering a step the current scope doesn't include. */
import { redirect } from "next/navigation";
import { FormField, Input, Textarea } from "@/components/ui";
import { ShopStepActions, ShopStepShell } from "@/components/vendor/ShopStepShell";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { SHIPPING_METHODS, getOrCreateShop, getShopCompletion, isShopStepOnHold } from "@/lib/vendorShop";
import { saveShopDeliveryAction } from "@/app/vendor/shop/actions";

export const revalidate = 0;

const METHOD_LABELS: Record<(typeof SHIPPING_METHODS)[number], string> = {
  SURFACE: "Surface / road",
  AIR: "Air freight",
  RAIL: "Rail",
  COURIER: "Courier",
  SELF_TRANSPORT: "Own fleet",
  BUYER_PICKUP: "Buyer pickup",
};

export default async function ShopDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  if (isShopStepOnHold("delivery")) redirect("/vendor/shop");

  const supplier = await requireVendorForShopSetup("/vendor/shop/delivery");

  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);

  return (
    <ShopStepShell
      step="delivery"
      description="Where you deliver, how goods move, and what buyers should expect."
      completion={completion}
      error={error}
      saved={saved}
    >
      <form action={saveShopDeliveryAction} className="flex flex-col gap-3.5">
        <FormField
          htmlFor="deliveryAreas"
          label="Delivery areas"
          required
          hint="One per line — states, cities or regions you ship to. Up to 50."
        >
          {/* strList() splits on newlines and commas, so a textarea is the
              natural input for this String[] column. */}
          <Textarea
            id="deliveryAreas"
            name="deliveryAreas"
            rows={4}
            required
            placeholder={"Maharashtra\nGujarat\nPune"}
            defaultValue={shop.deliveryAreas.join("\n")}
          />
        </FormField>

        <fieldset>
          <legend className="mb-1.5 flex items-baseline gap-1 text-[12.5px] font-bold text-ink">
            Shipping methods <span className="text-accent">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {SHIPPING_METHODS.map((method) => (
              <label key={method} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="shippingMethods"
                  value={method}
                  defaultChecked={shop.shippingMethods.includes(method)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-150 hover:border-ink peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:border-ink">
                  {METHOD_LABELS[method]}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11.5px] text-faint">Choose at least one method.</p>
        </fieldset>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField
            htmlFor="deliveryEta"
            label="Estimated delivery time"
            required
            hint="What buyers should expect from dispatch."
          >
            <Input
              id="deliveryEta"
              name="deliveryEta"
              required
              maxLength={200}
              placeholder="3–5 business days"
              defaultValue={shop.deliveryEta ?? ""}
            />
          </FormField>

          <FormField
            htmlFor="deliveryCharges"
            label="Delivery charges"
            hint="Optional. Free text — charges often depend on order value or location."
          >
            <Input
              id="deliveryCharges"
              name="deliveryCharges"
              maxLength={200}
              placeholder="Free above ₹25,000, otherwise ₹500"
              defaultValue={shop.deliveryCharges ?? ""}
            />
          </FormField>
        </div>

        <FormField
          htmlFor="dispatchAddress"
          label="Dispatch location"
          hint="Optional. The warehouse or yard orders ship from, if different from your office."
        >
          <Input
            id="dispatchAddress"
            name="dispatchAddress"
            maxLength={5000}
            placeholder="Warehouse B, Chakan MIDC, Pune"
            defaultValue={shop.dispatchAddress ?? ""}
          />
        </FormField>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line p-3.5">
          <input
            type="checkbox"
            name="selfPickup"
            defaultChecked={shop.selfPickup}
            className="mt-0.5 h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          <span>
            <span className="block text-[12.5px] font-bold text-ink">Buyers can collect from us</span>
            <span className="mt-0.5 block text-[11.5px] text-sub">
              Optional. Shows buyers they can arrange their own pickup from your dispatch location.
            </span>
          </span>
        </label>

        <p className="text-[11.5px] text-faint">
          Delivery areas, shipping methods and estimated delivery time are needed to complete this step.
        </p>

        <ShopStepActions />
      </form>
    </ShopStepShell>
  );
}
