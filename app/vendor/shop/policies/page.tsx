/* Policies is ON HOLD — see ON_HOLD_SHOP_STEPS in lib/vendorShop.ts. The form
 * below is kept intact and reactivates the moment "policies" leaves that list;
 * until then this route sends the vendor back to the overview rather than
 * offering a step the current scope doesn't include. */
import { redirect } from "next/navigation";
import { FormField, Textarea } from "@/components/ui";
import { ShopStepActions, ShopStepShell } from "@/components/vendor/ShopStepShell";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { getOrCreateShop, getShopCompletion, isShopStepOnHold } from "@/lib/vendorShop";
import { saveShopPoliciesAction } from "@/app/vendor/shop/actions";

export const revalidate = 0;

export default async function ShopPoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  if (isShopStepOnHold("policies")) redirect("/vendor/shop");

  const supplier = await requireVendorForShopSetup("/vendor/shop/policies");

  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);

  return (
    <ShopStepShell
      step="policies"
      description="The terms buyers agree to when they order from you. Shown on your storefront."
      completion={completion}
      error={error}
      saved={saved}
    >
      <form action={saveShopPoliciesAction} className="flex flex-col gap-3.5">
        <FormField
          htmlFor="returnPolicy"
          label="Return policy"
          required
          hint="When goods can be returned, and in what condition."
        >
          <Textarea
            id="returnPolicy"
            name="returnPolicy"
            rows={4}
            required
            maxLength={5000}
            placeholder="Unused goods in original packaging may be returned within 7 days of delivery. Return freight is borne by the buyer unless the goods were damaged or incorrect."
            defaultValue={shop.returnPolicy ?? ""}
          />
        </FormField>

        <FormField
          htmlFor="refundPolicy"
          label="Refund policy"
          required
          hint="How and when buyers get their money back."
        >
          <Textarea
            id="refundPolicy"
            name="refundPolicy"
            rows={4}
            required
            maxLength={5000}
            placeholder="Approved refunds are processed to the original payment method within 10 working days of the returned goods being received and inspected."
            defaultValue={shop.refundPolicy ?? ""}
          />
        </FormField>

        <FormField
          htmlFor="cancellationPolicy"
          label="Cancellation policy"
          required
          hint="Until when an order can be cancelled, and any charges."
        >
          <Textarea
            id="cancellationPolicy"
            name="cancellationPolicy"
            rows={4}
            required
            maxLength={5000}
            placeholder="Orders may be cancelled free of charge any time before dispatch. Once dispatched, the return policy applies."
            defaultValue={shop.cancellationPolicy ?? ""}
          />
        </FormField>

        <FormField
          htmlFor="warrantyInfo"
          label="Warranty information"
          hint="Optional. Any guarantee you offer against defects."
        >
          <Textarea
            id="warrantyInfo"
            name="warrantyInfo"
            rows={4}
            maxLength={5000}
            placeholder="12 months against manufacturing defects from the date of invoice. Warranty does not cover misuse or normal wear."
            defaultValue={shop.warrantyInfo ?? ""}
          />
        </FormField>

        <p className="text-[11.5px] text-faint">
          Return, refund and cancellation policies are needed to complete this step. Warranty information is optional.
        </p>

        <ShopStepActions />
      </form>
    </ShopStepShell>
  );
}
