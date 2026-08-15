"use server";

/* Shop Setup Server Actions.
 *
 * Thin layer: parse FormData, derive the vendor from the session, hand a typed
 * input to lib/vendorShop.ts, and turn its error code into ?error=. No action
 * accepts a supplierId or shopId from the client — Shop Setup is available to
 * any signed-in vendor (including one still awaiting verification), while
 * publishing goes through the approval-gated eligibility check. */

import { redirect } from "next/navigation";
import { bool, file, str, strList, withErrorParam } from "@/lib/formData";
import { requireVendorId } from "@/lib/vendorAccess";
import {
  addShopCertification,
  deleteShopCertification,
  publishShop,
  saveShopBasics,
  saveShopBranding,
  saveShopBusiness,
  saveShopDelivery,
  saveShopPolicies,
  saveShopSocial,
  unpublishShop,
  updateShopCertification,
  ACTIVE_SHOP_STEPS,
  type ShopSaveResult,
  type ShopSetupStep,
} from "@/lib/vendorShop";
import type { ShopCertificationType } from "@/lib/generated/prisma/client";

const CERTIFICATION_TYPES: ShopCertificationType[] = [
  "ISO",
  "MSME",
  "BIS",
  "AUTHORIZED_DEALER",
  "COMPANY_BROCHURE",
  "PROJECT_PORTFOLIO",
  "OTHER",
];

function stepPath(step: ShopSetupStep) {
  return `/vendor/shop/${step}`;
}

/** Where a successful save lands. "Save & continue" advances to the next step;
 * "Save & finish later" returns to the overview. Both submit the same form to
 * the same action — the intent only picks a redirect target, so there is no
 * second save endpoint to keep in sync. */
function destinationFor(step: ShopSetupStep, formData: FormData): string {
  if (str(formData, "intent") === "continue") {
    // Walks the active scope, so "continue" skips any step currently on hold.
    // A step that is itself on hold has no place in the sequence — its action is
    // retained but unreachable from the UI, so it returns to the overview.
    const position = ACTIVE_SHOP_STEPS.indexOf(step);
    const next = position === -1 ? undefined : ACTIVE_SHOP_STEPS[position + 1];
    if (next) return `/vendor/shop/${next}?saved=${step}`;
    if (position === -1) return `/vendor/shop?saved=${step}`;
    // Past the last step, "continue" leads to the preview rather than dead-ending.
    return `/vendor/shop/preview`;
  }
  return `/vendor/shop?saved=${step}`;
}

/** Bounces back to the step with ?error= on failure, or forward to `destination`
 * (defaulting to the same step) so the wizard can confirm the save without a
 * flash-message store. */
function finish(step: ShopSetupStep, result: ShopSaveResult, destination?: string): never {
  if ("error" in result) redirect(withErrorParam(stepPath(step), result.error));
  redirect(destination ?? `${stepPath(step)}?saved=${step}`);
}

export async function saveShopBasicsAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("basics"));

  finish(
    "basics",
    await saveShopBasics(supplierId, {
      name: str(formData, "name"),
      description: str(formData, "description"),
      supportEmail: str(formData, "supportEmail")?.toLowerCase(),
      supportPhone: str(formData, "supportPhone"),
      categoryId: str(formData, "categoryId"),
      storeSlug: str(formData, "storeSlug"),
    }),
    destinationFor("basics", formData),
  );
}

export async function saveShopBrandingAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("branding"));

  finish(
    "branding",
    await saveShopBranding(supplierId, {
      logo: file(formData, "logo"),
      banner: file(formData, "banner"),
      removeLogo: bool(formData, "removeLogo"),
      removeBanner: bool(formData, "removeBanner"),
      // Absent when the vendor ticked "Use no brand colour" (the input is
      // disabled, so it isn't submitted) — saveShopBranding reads that as clear.
      brandColor: str(formData, "brandColor"),
    }),
    destinationFor("branding", formData),
  );
}

export async function saveShopBusinessAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("business"));

  finish(
    "business",
    await saveShopBusiness(supplierId, {
      businessEmail: str(formData, "businessEmail")?.toLowerCase(),
      // No website: the field is out of scope for now, and omitting the key
      // leaves any previously saved Shop.website untouched.
      hoursOpen: str(formData, "hoursOpen"),
      hoursClose: str(formData, "hoursClose"),
      workingDays: strList(formData, "workingDays"),
      addressLine: str(formData, "addressLine"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      pincode: str(formData, "pincode"),
    }),
    destinationFor("business", formData),
  );
}

export async function saveShopDeliveryAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("delivery"));

  finish(
    "delivery",
    await saveShopDelivery(supplierId, {
      deliveryAreas: strList(formData, "deliveryAreas"),
      shippingMethods: strList(formData, "shippingMethods"),
      deliveryCharges: str(formData, "deliveryCharges"),
      deliveryEta: str(formData, "deliveryEta"),
      selfPickup: bool(formData, "selfPickup"),
      dispatchAddress: str(formData, "dispatchAddress"),
    }),
    destinationFor("delivery", formData),
  );
}

export async function saveShopPoliciesAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("policies"));

  finish(
    "policies",
    await saveShopPolicies(supplierId, {
      returnPolicy: str(formData, "returnPolicy"),
      refundPolicy: str(formData, "refundPolicy"),
      cancellationPolicy: str(formData, "cancellationPolicy"),
      warrantyInfo: str(formData, "warrantyInfo"),
    }),
    destinationFor("policies", formData),
  );
}

export async function saveShopSocialAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("social"));

  finish(
    "social",
    await saveShopSocial(supplierId, {
      linkedinUrl: str(formData, "linkedinUrl"),
      facebookUrl: str(formData, "facebookUrl"),
      instagramUrl: str(formData, "instagramUrl"),
      youtubeUrl: str(formData, "youtubeUrl"),
      // No website here — Business Details owns Shop.website.
      whatsappNumber: str(formData, "whatsappNumber"),
    }),
    // Social is on hold, so it sits outside the active sequence and both intents
    // land on the overview. Retained so the step can be switched back on.
    destinationFor("social", formData),
  );
}

/** A submitted certification type is a client-supplied string until it's
 * matched against the enum. */
function certificationType(formData: FormData): ShopCertificationType | undefined {
  const raw = str(formData, "type");
  return CERTIFICATION_TYPES.find((type) => type === raw);
}

export async function addShopCertificationAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("certifications"));

  const type = certificationType(formData);
  const upload = file(formData, "file");
  if (!type) finish("certifications", { error: "type" });
  if (!upload) finish("certifications", { error: "fileMissing" });

  finish(
    "certifications",
    await addShopCertification(supplierId, { type, title: str(formData, "title"), file: upload }),
  );
}

export async function updateShopCertificationAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("certifications"));

  const certificationId = str(formData, "certificationId");
  if (!certificationId) finish("certifications", { error: "notFound" });

  finish(
    "certifications",
    await updateShopCertification(supplierId, certificationId, {
      type: certificationType(formData),
      title: str(formData, "title"),
      file: file(formData, "file"),
    }),
  );
}

export async function deleteShopCertificationAction(formData: FormData) {
  const supplierId = await requireVendorId(stepPath("certifications"));

  const certificationId = str(formData, "certificationId");
  if (!certificationId) finish("certifications", { error: "notFound" });

  finish("certifications", await deleteShopCertification(supplierId, certificationId));
}

export async function publishShopAction() {
  const supplierId = await requireVendorId("/vendor/shop");

  const result = await publishShop(supplierId);
  if ("error" in result) redirect(withErrorParam("/vendor/shop", result.error));
  redirect("/vendor/shop?published=1");
}

export async function unpublishShopAction() {
  const supplierId = await requireVendorId("/vendor/shop");

  await unpublishShop(supplierId);
  redirect("/vendor/shop?hidden=1");
}
