import { FormField, Input } from "@/components/ui";
import { ShopStepActions, ShopStepShell } from "@/components/vendor/ShopStepShell";
import { requireVendorForShopSetup } from "@/lib/vendorAccess";
import { WORKING_DAYS, getOrCreateShop, getShopCompletion } from "@/lib/vendorShop";
import { saveShopBusinessAction } from "@/app/vendor/shop/actions";

export const revalidate = 0;

const DAY_LABELS: Record<(typeof WORKING_DAYS)[number], string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

/** Sensible opening pattern for a first-time vendor — only used when nothing
 * has been saved yet, never to overwrite a stored choice. */
const DEFAULT_WORKING_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default async function ShopBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const supplier = await requireVendorForShopSetup("/vendor/shop/business");

  const shop = await getOrCreateShop(supplier.id);
  const completion = getShopCompletion(shop);

  /* Prefill from the shop first, then the business data the vendor already gave
   * during account onboarding — nothing gets typed twice. */
  const businessEmail = shop.businessEmail ?? supplier.email ?? "";
  /* No website field: it's out of scope for now. Shop.website stays in the
   * database and saveShopBusiness still knows how to write it — this step just
   * doesn't collect it, and doesn't clear what's already stored. */
  const addressLine = shop.addressLine ?? supplier.address ?? "";
  const city = shop.city ?? supplier.city ?? "";
  const state = shop.state ?? supplier.state ?? "";
  const pincode = shop.pincode ?? supplier.pincode ?? "";
  const selectedDays = shop.workingDays.length > 0 ? shop.workingDays : DEFAULT_WORKING_DAYS;

  return (
    <ShopStepShell
      step="business"
      description="When you're open and where you operate from. Buyers see this on your storefront."
      completion={completion}
      error={error}
      saved={saved}
    >
      <form action={saveShopBusinessAction} className="flex flex-col gap-3.5">
        <FormField htmlFor="businessEmail" label="Business email" required hint="Your official business address.">
          <Input
            id="businessEmail"
            name="businessEmail"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="accounts@yourcompany.in"
            defaultValue={businessEmail}
          />
        </FormField>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <FormField htmlFor="hoursOpen" label="Opening time" required hint="24-hour clock.">
            <Input id="hoursOpen" name="hoursOpen" type="time" required defaultValue={shop.hoursOpen ?? "09:00"} />
          </FormField>

          <FormField htmlFor="hoursClose" label="Closing time" required hint="24-hour clock.">
            <Input id="hoursClose" name="hoursClose" type="time" required defaultValue={shop.hoursClose ?? "18:00"} />
          </FormField>
        </div>

        <fieldset>
          <legend className="mb-1.5 flex items-baseline gap-1 text-[12.5px] font-bold text-ink">
            Working days <span className="text-accent">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {WORKING_DAYS.map((day) => (
              <label key={day} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="workingDays"
                  value={day}
                  defaultChecked={selectedDays.includes(day)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors duration-150 hover:border-ink peer-checked:border-accent peer-checked:bg-accent peer-checked:text-white peer-focus-visible:border-ink">
                  {DAY_LABELS[day]}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11.5px] text-faint">Choose at least one day.</p>
        </fieldset>

        <FormField htmlFor="addressLine" label="Office / warehouse address" required hint="Street address of your main premises.">
          <Input
            id="addressLine"
            name="addressLine"
            required
            maxLength={5000}
            autoComplete="street-address"
            placeholder="Plot 12, MIDC Industrial Area"
            defaultValue={addressLine}
          />
        </FormField>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <FormField htmlFor="city" label="City" required>
            <Input id="city" name="city" required maxLength={200} autoComplete="address-level2" defaultValue={city} />
          </FormField>

          <FormField htmlFor="state" label="State" required>
            <Input id="state" name="state" required maxLength={200} autoComplete="address-level1" defaultValue={state} />
          </FormField>

          <FormField htmlFor="pincode" label="PIN code" required hint="6 digits.">
            <Input
              id="pincode"
              name="pincode"
              required
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              autoComplete="postal-code"
              placeholder="411026"
              defaultValue={pincode}
            />
          </FormField>
        </div>

        <ShopStepActions />
      </form>
    </ShopStepShell>
  );
}
