import { Icon } from "@/components/icons/Icon";
import { GENERIC_ERROR, SHOP_SETUP_ERRORS } from "./shopSetupMeta";

/** The wizard's single feedback surface. Server Actions redirect back with
 * ?error=<code> or ?saved=<step>, matching the ?error= idiom the rest of the
 * vendor portal already uses — no toast library, no client state. */
export function ShopSetupNotice({
  error,
  saved,
  published,
  hidden,
}: {
  error?: string;
  saved?: string;
  /** ?published=1 / ?hidden=1 from publishShopAction / unpublishShopAction. */
  published?: boolean;
  hidden?: boolean;
}) {
  if (error) {
    return (
      <p
        role="alert"
        className="mb-4 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/[0.06] px-3.5 py-3 text-[12.5px] font-semibold text-ink"
      >
        <Icon name="x" size={15} strokeWidth={2.2} className="mt-px shrink-0 text-accent" />
        {SHOP_SETUP_ERRORS[error] ?? GENERIC_ERROR}
      </p>
    );
  }

  const message = published
    ? "Your shop is live. Buyers can now find it."
    : hidden
      ? "Your shop is hidden from buyers. Your details and products are unchanged."
      : saved
        ? "Shop details saved."
        : null;

  if (!message) return null;

  return (
    <p
      role="status"
      className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-wash px-3.5 py-3 text-[12.5px] font-semibold text-ink"
    >
      <Icon name="check" size={15} strokeWidth={2.4} className="mt-px shrink-0 text-ink" />
      {message}
    </p>
  );
}
