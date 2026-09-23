import { requireOnboardingStep } from "@/lib/vendorOnboarding";
import { getCategories } from "@/lib/catalog";
import { saveOnboardingBusinessAction } from "@/app/vendor/onboarding/actions";
import { SubmitButton, Input, Select, FormField, buttonClassName } from "@/components/ui";
import { OnboardingStepper } from "@/components/vendor/OnboardingStepper";

export const revalidate = 0;

const BUSINESS_TYPES: { value: string; label: string }[] = [
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
  { value: "IMPORTER_EXPORTER", label: "Importer / Exporter" },
  { value: "CONTRACTOR", label: "Contractor" },
];

export default async function OnboardingBusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [supplier, categories, { error }] = await Promise.all([
    requireOnboardingStep("business"),
    getCategories(),
    searchParams,
  ]);

  return (
    <div>
      <OnboardingStepper current="business" />

      <h1 className="mt-6 text-lg font-extrabold text-ink">Business information</h1>
      <p className="mt-1.5 text-[13px] text-sub">Tell us about your business.</p>

      {error === "identify" && (
        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-[12.5px] font-semibold text-ink">
          Please fill in all required fields.
        </p>
      )}

      <form action={saveOnboardingBusinessAction} className="mt-5 flex flex-col gap-3.5">
        <FormField htmlFor="name" label="Business name" required>
          <Input id="name" name="name" required defaultValue={supplier.name} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField htmlFor="businessType" label="Business type" required>
            <Select id="businessType" name="businessType" required defaultValue={supplier.businessType ?? ""}>
              <option value="" disabled>
                Choose one
              </option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="businessCategoryId" label="Business category" required>
            <Select id="businessCategoryId" name="businessCategoryId" required defaultValue={supplier.businessCategoryId ?? ""}>
              <option value="" disabled>
                Choose one
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField htmlFor="years" label="Years in business" required>
          <Input id="years" name="years" type="number" min={0} required defaultValue={supplier.years || undefined} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField htmlFor="gstNumber" label="GST number" hint="Optional">
            <Input id="gstNumber" name="gstNumber" defaultValue={supplier.gstNumber ?? ""} />
          </FormField>
          <FormField htmlFor="panNumber" label="PAN number" hint="Optional">
            <Input id="panNumber" name="panNumber" defaultValue={supplier.panNumber ?? ""} />
          </FormField>
        </div>

        <FormField htmlFor="address" label="Business address" required>
          <Input id="address" name="address" required defaultValue={supplier.address ?? ""} />
        </FormField>

        <div className="grid grid-cols-3 gap-3">
          <FormField htmlFor="city" label="City" required>
            <Input id="city" name="city" required defaultValue={supplier.city || undefined} />
          </FormField>
          <FormField htmlFor="state" label="State" required>
            <Input id="state" name="state" required defaultValue={supplier.state ?? ""} />
          </FormField>
          <FormField htmlFor="pincode" label="Pincode" required>
            <Input id="pincode" name="pincode" required defaultValue={supplier.pincode ?? ""} />
          </FormField>
        </div>

        <FormField htmlFor="website" label="Website" hint="Optional">
          <Input id="website" name="website" type="url" placeholder="https://" defaultValue={supplier.website ?? ""} />
        </FormField>

        <SubmitButton pendingText="Saving…" className={buttonClassName({ variant: "success", full: true, size: "lg" })}>
          Continue
        </SubmitButton>
      </form>
    </div>
  );
}
