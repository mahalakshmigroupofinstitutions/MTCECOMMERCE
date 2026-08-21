import { CatalogImage, FileInput, FormField } from "@/components/ui";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/localFileStorage";

const ACCEPT = ALLOWED_IMAGE_TYPES.join(",");
const MAX_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

/** One uploadable shop image (logo or banner): current preview, replace picker,
 * and a remove checkbox. Removal is a checkbox inside the same form rather than
 * its own button because saveShopBranding treats an absent brandColor as
 * "clear it" — a separate mini-form would wipe the brand colour as a side
 * effect. Picking a new file wins over the checkbox server-side. */
export function ShopImageField({
  name,
  removeName,
  label,
  hint,
  currentUrl,
  previewLabel,
  previewHeight,
}: {
  name: string;
  removeName: string;
  label: string;
  hint: string;
  currentUrl: string | null;
  previewLabel: string;
  previewHeight: number;
}) {
  return (
    <div className="rounded-2xl border border-line p-4">
      <FormField htmlFor={name} label={label} hint={`${hint} PNG, JPG or WebP, up to ${MAX_MB} MB.`}>
        <div className="mb-3">
          <CatalogImage src={currentUrl} label={previewLabel} height={previewHeight} />
        </div>
        <FileInput id={name} name={name} accept={ACCEPT} />
      </FormField>

      {currentUrl && (
        <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-sub">
          <input type="checkbox" name={removeName} className="h-3.5 w-3.5 accent-[var(--color-accent)]" />
          Remove current {label.toLowerCase()}
        </label>
      )}
    </div>
  );
}
