/* Shop Setup backend.
 *
 * One Shop per Supplier, seven independently-saveable steps, all persisted as
 * columns on a single row. Two rules run through the whole file:
 *
 *   1. Ownership comes from the session, never the request. Every write is
 *      scoped by `where: { supplierId }` (unique) or by a relation filter that
 *      walks back to the same supplier, so a vendor physically cannot address
 *      another vendor's shop even by guessing ids.
 *   2. Completion is derived, never asserted. `completedSteps` and `status` are
 *      recomputed from persisted data after every mutation, so navigating to a
 *      step, or emptying a field after publishing, can't fake a ready shop. */
import "server-only";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_CERTIFICATION_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_CERTIFICATION_BYTES,
  MAX_IMAGE_BYTES,
  deleteVendorPrivateFile,
  deleteVendorPublicImage,
  saveVendorPublicImage,
  saveVendorShopCertification,
  validateUpload,
} from "@/lib/localFileStorage";
import { normalizePhone } from "@/lib/phone";
import { publicProductWhere, publicShopWhere, publicSupplierWhere } from "@/lib/publicVisibility";
import { slugify } from "@/lib/slug";
import { exceedsLength, isEmail, isHexColor, isPincode, isTimeOfDay, normalizeUrl } from "@/lib/validate";
import type { Prisma, Shop, ShopCertificationType, ShopStatus } from "@/lib/generated/prisma/client";

export const SHOP_SETUP_STEPS = [
  "basics",
  "branding",
  "business",
  "delivery",
  "policies",
  "certifications",
  "social",
] as const;
export type ShopSetupStep = (typeof SHOP_SETUP_STEPS)[number];

/** Steps whose backend is finished but which are deliberately out of the current
 * product scope. Nothing here is deleted: the save functions, validation and
 * columns all still exist, and any data a vendor already saved stays untouched.
 * Reactivating a step is a one-line change — remove it from this list and its
 * page, checklist entry and progress share come back. */
export const ON_HOLD_SHOP_STEPS: readonly ShopSetupStep[] = ["delivery", "policies", "social"];

export function isShopStepOnHold(step: ShopSetupStep): boolean {
  return ON_HOLD_SHOP_STEPS.includes(step);
}

/** The steps the vendor UI actually shows and counts today. */
export const ACTIVE_SHOP_STEPS: readonly ShopSetupStep[] = SHOP_SETUP_STEPS.filter((step) => !isShopStepOnHold(step));

/** Steps that must be satisfied before a shop can go LIVE. Certifications are a
 * marketing extra — tracked for progress, never blocking. Delivery and Policies
 * were required until they went on hold; an on-hold step must never keep a
 * vendor from finishing or publishing. */
export const REQUIRED_SHOP_STEPS: readonly ShopSetupStep[] = ["basics", "branding", "business"];

/** Stored as short codes rather than display names so the UI can relabel or
 * translate them without a data migration. */
export const WORKING_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

/** Closed vocabulary so buyer-facing filtering stays possible later; the column
 * is String[] only because Postgres enum arrays are painful to extend. */
export const SHIPPING_METHODS = ["SURFACE", "AIR", "RAIL", "COURIER", "SELF_TRANSPORT", "BUYER_PICKUP"] as const;

const MAX_SHORT_TEXT = 200;
const MAX_LONG_TEXT = 5000;
const MAX_LIST_ITEMS = 50;
const MAX_CERTIFICATIONS = 20;

const SHOP_INCLUDE = {
  category: true,
  certifications: { orderBy: { uploadedAt: "desc" } },
} satisfies Prisma.ShopInclude;

export type VendorShop = Prisma.ShopGetPayload<{ include: typeof SHOP_INCLUDE }>;

/** Error codes are returned rather than thrown so Server Actions can map them
 * straight onto ?error= without a try/catch around a `redirect()`. */
export type ShopSaveResult = { error: string } | { shop: VendorShop };

// ---------------------------------------------------------------- retrieval

/** The authenticated supplier's shop, created on first access. Seeded from the
 * data the vendor already gave during onboarding so step 1 opens pre-filled
 * instead of blank — no duplicate typing of name, address or category. */
export async function getOrCreateShop(supplierId: string): Promise<VendorShop> {
  const existing = await prisma.shop.findUnique({ where: { supplierId }, include: SHOP_INCLUDE });
  /* Reconciled on read, not just after a write: the stored status was derived
   * under whatever the required-step scope was at the time, so a shop saved
   * while Delivery and Policies were required must not keep showing INCOMPLETE
   * now that they're on hold. Writes only when the derivation actually differs. */
  if (existing) return applyShopState(existing);

  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id: supplierId },
    select: {
      name: true,
      blurb: true,
      email: true,
      phone: true,
      businessCategoryId: true,
      imageUrl: true,
      website: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
    },
  });

  try {
    await prisma.shop.create({
      data: {
        supplierId,
        name: supplier.name,
        description: supplier.blurb,
        supportEmail: supplier.email,
        supportPhone: supplier.phone,
        categoryId: supplier.businessCategoryId,
        logoUrl: supplier.imageUrl,
        businessEmail: supplier.email,
        website: supplier.website,
        addressLine: supplier.address,
        city: supplier.city || null,
        state: supplier.state,
        pincode: supplier.pincode,
      },
    });
  } catch {
    // Lost a race with a concurrent first load; the unique supplierId held, so
    // the sync below simply picks up whichever row won.
  }

  const shop = await prisma.shop.findUniqueOrThrow({ where: { supplierId }, include: SHOP_INCLUDE });
  return syncShopState(shop.id);
}

export async function getShopForSupplier(supplierId: string): Promise<VendorShop | null> {
  return prisma.shop.findUnique({ where: { supplierId }, include: SHOP_INCLUDE });
}

// --------------------------------------------------------------- completion

type ShopCompletionInput = Shop & { certifications: { id: string }[] };

const STEP_CHECKS: Record<ShopSetupStep, (shop: ShopCompletionInput) => boolean> = {
  basics: (s) => Boolean(s.name.trim() && s.description?.trim() && isEmail(s.supportEmail) && s.categoryId),
  branding: (s) => Boolean(s.logoUrl),
  business: (s) =>
    Boolean(
      isEmail(s.businessEmail) &&
        s.hoursOpen &&
        s.hoursClose &&
        s.workingDays.length > 0 &&
        s.addressLine?.trim() &&
        s.city?.trim() &&
        s.state?.trim() &&
        isPincode(s.pincode),
    ),
  delivery: (s) => s.deliveryAreas.length > 0 && s.shippingMethods.length > 0 && Boolean(s.deliveryEta?.trim()),
  policies: (s) => Boolean(s.returnPolicy?.trim() && s.refundPolicy?.trim() && s.cancellationPolicy?.trim()),
  certifications: (s) => s.certifications.length > 0,
  /* Deliberately excludes Shop.website: the Business Details step writes that
   * same column, so counting it here made entering a company website silently
   * complete the Social step. Only real social handles count. */
  social: (s) => Boolean(s.linkedinUrl || s.facebookUrl || s.instagramUrl || s.youtubeUrl || s.whatsappNumber),
};

export interface ShopCompletion {
  steps: Record<ShopSetupStep, boolean>;
  completed: ShopSetupStep[];
  missingRequired: ShopSetupStep[];
  isComplete: boolean;
  percent: number;
}

/** Which steps hold valid persisted data. Pure and synchronous, so pages can
 * call it on an already-loaded shop without a second query.
 *
 * `steps` still answers for every step, including the on-hold ones, so nothing
 * that inspects stored Delivery/Policies/Social data breaks. Progress and status
 * are measured over ACTIVE_SHOP_STEPS only — an on-hold step can neither be
 * credited nor counted against the vendor. */
export function getShopCompletion(shop: ShopCompletionInput): ShopCompletion {
  const steps = Object.fromEntries(
    SHOP_SETUP_STEPS.map((step) => [step, STEP_CHECKS[step](shop)]),
  ) as Record<ShopSetupStep, boolean>;

  const completed = ACTIVE_SHOP_STEPS.filter((step) => steps[step]);
  const missingRequired = REQUIRED_SHOP_STEPS.filter((step) => !steps[step]);

  return {
    steps,
    completed,
    missingRequired,
    isComplete: missingRequired.length === 0,
    percent: Math.round((completed.length / ACTIVE_SHOP_STEPS.length) * 100),
  };
}

/** Recomputes completedSteps and status from what is actually stored. Called
 * after every mutation. A LIVE shop whose required data was later emptied is
 * demoted, so the publishing rules can't be sidestepped by publishing first and
 * deleting afterwards. */
async function syncShopState(shopId: string): Promise<VendorShop> {
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId }, include: SHOP_INCLUDE });
  return applyShopState(shop);
}

/** The same derivation against an already-loaded shop, so a caller that just
 * read the row doesn't pay for a second query. */
async function applyShopState(shop: VendorShop): Promise<VendorShop> {
  const completion = getShopCompletion(shop);

  let status: ShopStatus;
  if (completion.isComplete) {
    // A vendor's explicit LIVE/HIDDEN choice outranks the derived READY.
    status = shop.status === "LIVE" || shop.status === "HIDDEN" ? shop.status : "READY";
  } else {
    status = completion.completed.length === 0 ? "DRAFT" : "INCOMPLETE";
  }

  const stepsUnchanged =
    shop.completedSteps.length === completion.completed.length &&
    completion.completed.every((step, i) => shop.completedSteps[i] === step);
  if (stepsUnchanged && status === shop.status) return shop;

  return prisma.shop.update({
    where: { id: shop.id },
    data: {
      completedSteps: completion.completed,
      status,
      ...(shop.status === "LIVE" && status !== "LIVE" ? { publishedAt: null } : {}),
    },
    include: SHOP_INCLUDE,
  });
}

// ------------------------------------------------------------------- step 1

export interface ShopBasicsInput {
  name?: string;
  description?: string;
  supportEmail?: string;
  supportPhone?: string;
  categoryId?: string;
  /** Optional edit of the canonical storefront slug (Supplier.slug). */
  storeSlug?: string;
}

export async function saveShopBasics(supplierId: string, input: ShopBasicsInput): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  if (!input.name) return { error: "name" };
  if (exceedsLength(input.name, MAX_SHORT_TEXT)) return { error: "nameLength" };
  if (exceedsLength(input.description, MAX_LONG_TEXT)) return { error: "descriptionLength" };
  if (input.supportEmail && !isEmail(input.supportEmail)) return { error: "email" };

  const supportPhone = input.supportPhone ? normalizePhone(input.supportPhone) : null;
  if (input.supportPhone && !supportPhone) return { error: "phone" };

  if (input.categoryId) {
    const category = await prisma.category.count({ where: { id: input.categoryId } });
    if (category === 0) return { error: "category" };
  }

  // The storefront URL lives on Supplier.slug (/supplier/[slug]) — Shop has no
  // slug of its own, so this writes through to the supplier row.
  if (input.storeSlug !== undefined) {
    const slug = slugify(input.storeSlug);
    if (slug.length < 3 || slug === "item") return { error: "slug" };
    const taken = await prisma.supplier.findFirst({
      where: { slug, id: { not: supplierId } },
      select: { id: true },
    });
    if (taken) return { error: "slugTaken" };
    await prisma.supplier.update({ where: { id: supplierId }, data: { slug } });
  }

  await prisma.shop.update({
    where: { supplierId },
    data: {
      name: input.name,
      description: input.description ?? null,
      supportEmail: input.supportEmail ?? null,
      supportPhone,
      categoryId: input.categoryId ?? null,
    },
  });

  return { shop: await syncShopState(shop.id) };
}

// ------------------------------------------------------------------- step 2

export interface ShopBrandingInput {
  logo?: File;
  banner?: File;
  removeLogo?: boolean;
  removeBanner?: boolean;
  brandColor?: string;
}

/** Upload / replace / remove for the shop logo and banner. Replaced and removed
 * files are unlinked from disk so vendor uploads don't accumulate forever. */
export async function saveShopBranding(supplierId: string, input: ShopBrandingInput): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  if (input.brandColor && !isHexColor(input.brandColor)) return { error: "color" };

  for (const upload of [input.logo, input.banner]) {
    if (!upload) continue;
    const rejection = validateUpload(upload, { allowed: ALLOWED_IMAGE_TYPES, maxBytes: MAX_IMAGE_BYTES });
    if (rejection) return { error: rejection === "type" ? "imageType" : "imageSize" };
  }

  const data: Prisma.ShopUpdateInput = {};
  const orphaned: (string | null)[] = [];

  if (input.logo) {
    data.logoUrl = await saveVendorPublicImage(input.logo, supplierId, "shop-logo");
    orphaned.push(shop.logoUrl);
  } else if (input.removeLogo) {
    data.logoUrl = null;
    orphaned.push(shop.logoUrl);
  }

  if (input.banner) {
    data.bannerUrl = await saveVendorPublicImage(input.banner, supplierId, "shop-banner");
    orphaned.push(shop.bannerUrl);
  } else if (input.removeBanner) {
    data.bannerUrl = null;
    orphaned.push(shop.bannerUrl);
  }

  data.brandColor = input.brandColor ?? null;

  await prisma.shop.update({ where: { supplierId }, data });
  // Only after the row committed — a failed update must not lose a live image.
  await Promise.all(orphaned.map(deleteVendorPublicImage));

  return { shop: await syncShopState(shop.id) };
}

// ------------------------------------------------------------------- step 3

export interface ShopBusinessInput {
  businessEmail?: string;
  /** On hold in the UI — the Business Details form no longer submits it. Kept
   * here (and still validated below) so the column and its owner survive the
   * pause; omitting the key leaves any stored website exactly as it was. */
  website?: string;
  hoursOpen?: string;
  hoursClose?: string;
  workingDays?: string[];
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export async function saveShopBusiness(supplierId: string, input: ShopBusinessInput): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  if (input.businessEmail && !isEmail(input.businessEmail)) return { error: "email" };
  if (input.pincode && !isPincode(input.pincode)) return { error: "pincode" };
  if (input.hoursOpen && !isTimeOfDay(input.hoursOpen)) return { error: "hours" };
  if (input.hoursClose && !isTimeOfDay(input.hoursClose)) return { error: "hours" };

  const workingDays = (input.workingDays ?? []).map((day) => day.toUpperCase());
  if (workingDays.some((day) => !WORKING_DAYS.includes(day as (typeof WORKING_DAYS)[number]))) {
    return { error: "workingDays" };
  }

  /* Absent key means "don't touch it", not "clear it" — the form stopped
   * sending website, and a save must not silently wipe a stored one. */
  let website: string | null | undefined;
  if (input.website !== undefined) {
    // An explicit empty string still clears it, as it always did.
    if (!input.website.trim()) website = null;
    else {
      website = normalizeUrl(input.website);
      if (!website) return { error: "website" };
    }
  }

  if (exceedsLength(input.addressLine, MAX_LONG_TEXT)) return { error: "addressLength" };

  await prisma.shop.update({
    where: { supplierId },
    data: {
      businessEmail: input.businessEmail ?? null,
      ...(website !== undefined ? { website } : {}),
      hoursOpen: input.hoursOpen ?? null,
      hoursClose: input.hoursClose ?? null,
      workingDays,
      addressLine: input.addressLine ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
    },
  });

  return { shop: await syncShopState(shop.id) };
}

// ------------------------------------------------------------------- step 4

export interface ShopDeliveryInput {
  deliveryAreas?: string[];
  shippingMethods?: string[];
  deliveryCharges?: string;
  deliveryEta?: string;
  selfPickup?: boolean;
  dispatchAddress?: string;
}

export async function saveShopDelivery(supplierId: string, input: ShopDeliveryInput): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  const deliveryAreas = input.deliveryAreas ?? [];
  if (deliveryAreas.length > MAX_LIST_ITEMS) return { error: "tooManyAreas" };
  if (deliveryAreas.some((area) => exceedsLength(area, MAX_SHORT_TEXT))) return { error: "areaLength" };

  const shippingMethods = (input.shippingMethods ?? []).map((method) => method.toUpperCase());
  if (shippingMethods.some((m) => !SHIPPING_METHODS.includes(m as (typeof SHIPPING_METHODS)[number]))) {
    return { error: "shippingMethod" };
  }

  if (exceedsLength(input.deliveryCharges, MAX_SHORT_TEXT)) return { error: "chargesLength" };
  if (exceedsLength(input.deliveryEta, MAX_SHORT_TEXT)) return { error: "etaLength" };
  if (exceedsLength(input.dispatchAddress, MAX_LONG_TEXT)) return { error: "addressLength" };

  await prisma.shop.update({
    where: { supplierId },
    data: {
      deliveryAreas,
      shippingMethods,
      deliveryCharges: input.deliveryCharges ?? null,
      deliveryEta: input.deliveryEta ?? null,
      selfPickup: input.selfPickup ?? false,
      dispatchAddress: input.dispatchAddress ?? null,
    },
  });

  return { shop: await syncShopState(shop.id) };
}

// ------------------------------------------------------------------- step 5

export interface ShopPoliciesInput {
  returnPolicy?: string;
  refundPolicy?: string;
  cancellationPolicy?: string;
  warrantyInfo?: string;
}

export async function saveShopPolicies(supplierId: string, input: ShopPoliciesInput): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  const fields = [input.returnPolicy, input.refundPolicy, input.cancellationPolicy, input.warrantyInfo];
  if (fields.some((value) => exceedsLength(value, MAX_LONG_TEXT))) return { error: "policyLength" };

  await prisma.shop.update({
    where: { supplierId },
    data: {
      returnPolicy: input.returnPolicy ?? null,
      refundPolicy: input.refundPolicy ?? null,
      cancellationPolicy: input.cancellationPolicy ?? null,
      warrantyInfo: input.warrantyInfo ?? null,
    },
  });

  return { shop: await syncShopState(shop.id) };
}

// ------------------------------------------------------------------- step 6

/* Certifications are shop marketing content. Uploading one never touches
 * Supplier.onboardingStatus — verification stays reviewer-driven off the KYC
 * documents in lib/vendorOnboarding.ts. Files are written to the private root
 * and served only through /api/vendor/shop-certifications/[id]. */

export interface ShopCertificationInput {
  type: ShopCertificationType;
  title?: string;
  file: File;
}

export async function addShopCertification(
  supplierId: string,
  input: ShopCertificationInput,
): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  if (shop.certifications.length >= MAX_CERTIFICATIONS) return { error: "tooMany" };
  if (exceedsLength(input.title, MAX_SHORT_TEXT)) return { error: "titleLength" };

  const rejection = validateUpload(input.file, {
    allowed: ALLOWED_CERTIFICATION_TYPES,
    maxBytes: MAX_CERTIFICATION_BYTES,
  });
  if (rejection) return { error: rejection === "type" ? "fileType" : "fileSize" };

  const saved = await saveVendorShopCertification(input.file, supplierId);
  await prisma.shopCertification.create({
    data: { shopId: shop.id, type: input.type, title: input.title ?? null, ...saved },
  });

  return { shop: await syncShopState(shop.id) };
}

export async function updateShopCertification(
  supplierId: string,
  certificationId: string,
  input: { type?: ShopCertificationType; title?: string; file?: File },
): Promise<ShopSaveResult> {
  // The relation filter is the ownership check: another vendor's certification
  // simply doesn't exist from here.
  const existing = await prisma.shopCertification.findFirst({
    where: { id: certificationId, shop: { supplierId } },
  });
  if (!existing) return { error: "notFound" };

  if (exceedsLength(input.title, MAX_SHORT_TEXT)) return { error: "titleLength" };

  const data: Prisma.ShopCertificationUpdateInput = {
    type: input.type ?? existing.type,
    title: input.title ?? null,
  };

  let replaced: string | null = null;
  if (input.file) {
    const rejection = validateUpload(input.file, {
      allowed: ALLOWED_CERTIFICATION_TYPES,
      maxBytes: MAX_CERTIFICATION_BYTES,
    });
    if (rejection) return { error: rejection === "type" ? "fileType" : "fileSize" };
    Object.assign(data, await saveVendorShopCertification(input.file, supplierId));
    replaced = existing.filePath;
  }

  await prisma.shopCertification.update({ where: { id: certificationId }, data });
  if (replaced) await deleteVendorPrivateFile(replaced);

  return { shop: await syncShopState(existing.shopId) };
}

export async function deleteShopCertification(
  supplierId: string,
  certificationId: string,
): Promise<ShopSaveResult> {
  const existing = await prisma.shopCertification.findFirst({
    where: { id: certificationId, shop: { supplierId } },
  });
  if (!existing) return { error: "notFound" };

  await prisma.shopCertification.delete({ where: { id: certificationId } });
  await deleteVendorPrivateFile(existing.filePath);

  return { shop: await syncShopState(existing.shopId) };
}

/** Ownership-scoped lookup for the authenticated download route. */
export async function getShopCertificationForSupplier(supplierId: string, certificationId: string) {
  return prisma.shopCertification.findFirst({ where: { id: certificationId, shop: { supplierId } } });
}

// ------------------------------------------------------------------- step 7

/* Shop.website is deliberately absent: the Business Details step is its sole
 * owner. Social Links neither reads nor writes it, so the two steps can't
 * overwrite each other through the shared column. */
export interface ShopSocialInput {
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
}

export async function saveShopSocial(supplierId: string, input: ShopSocialInput): Promise<ShopSaveResult> {
  const shop = await getOrCreateShop(supplierId);

  const links: Record<string, string | null> = {};
  for (const key of ["linkedinUrl", "facebookUrl", "instagramUrl", "youtubeUrl"] as const) {
    const raw = input[key];
    if (!raw) {
      links[key] = null;
      continue;
    }
    const normalized = normalizeUrl(raw);
    if (!normalized) return { error: key };
    links[key] = normalized;
  }

  const whatsappNumber = input.whatsappNumber ? normalizePhone(input.whatsappNumber) : null;
  if (input.whatsappNumber && !whatsappNumber) return { error: "whatsapp" };

  await prisma.shop.update({ where: { supplierId }, data: { ...links, whatsappNumber } });

  return { shop: await syncShopState(shop.id) };
}

// -------------------------------------------------------------- publishing

export type PublishBlocker = "notApproved" | "setupIncomplete" | "noPublishedProduct";

export interface PublishEligibility {
  ok: boolean;
  blockers: PublishBlocker[];
  missingSteps: ShopSetupStep[];
  publishedProducts: number;
}

/** The three conditions a shop must meet to go LIVE. Evaluated server-side on
 * every publish attempt — button visibility is not a control. */
export async function canPublishShop(supplierId: string): Promise<PublishEligibility> {
  const [supplier, shop, publishedProducts] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: supplierId }, select: { onboardingStatus: true } }),
    prisma.shop.findUnique({ where: { supplierId }, include: SHOP_INCLUDE }),
    prisma.product.count({ where: { supplierId, status: "PUBLISHED" } }),
  ]);

  const completion = shop ? getShopCompletion(shop) : null;
  const blockers: PublishBlocker[] = [];
  if (supplier?.onboardingStatus !== "APPROVED") blockers.push("notApproved");
  if (!completion?.isComplete) blockers.push("setupIncomplete");
  if (publishedProducts === 0) blockers.push("noPublishedProduct");

  return {
    ok: blockers.length === 0,
    blockers,
    missingSteps: completion ? completion.missingRequired : [...REQUIRED_SHOP_STEPS],
    publishedProducts,
  };
}

export async function publishShop(supplierId: string): Promise<{ error: PublishBlocker } | { shop: VendorShop }> {
  const eligibility = await canPublishShop(supplierId);
  if (!eligibility.ok) return { error: eligibility.blockers[0] };

  // publishedAt records the first time the shop went live, so re-publishing
  // after a HIDDEN spell doesn't reset the storefront's "selling since" date.
  const existing = await prisma.shop.findUniqueOrThrow({ where: { supplierId }, select: { publishedAt: true } });
  const shop = await prisma.shop.update({
    where: { supplierId },
    data: { status: "LIVE", publishedAt: existing.publishedAt ?? new Date() },
    include: SHOP_INCLUDE,
  });
  return { shop };
}

/** Vendor-initiated takedown. Keeps the shop's data and READY-ness intact. */
export async function unpublishShop(supplierId: string): Promise<VendorShop> {
  return prisma.shop.update({ where: { supplierId }, data: { status: "HIDDEN" }, include: SHOP_INCLUDE });
}

// ---------------------------------------------------------- public visibility

/* Columns belonging to the on-hold steps. They stay in the database and keep
 * whatever a vendor saved before the pause, but nothing buyer-facing may render
 * them, so they are stripped at the boundary rather than in each view. Website
 * is here too: it is out of scope until Business Details collects it again.
 *
 * Deleting a name from this list is what re-exposes a field — there is no
 * second place to remember. */
const NON_PUBLIC_SHOP_FIELDS = [
  "website",
  "linkedinUrl",
  "facebookUrl",
  "instagramUrl",
  "youtubeUrl",
  "whatsappNumber",
  "deliveryAreas",
  "shippingMethods",
  "deliveryCharges",
  "deliveryEta",
  "selfPickup",
  "dispatchAddress",
  "returnPolicy",
  "refundPolicy",
  "cancellationPolicy",
  "warrantyInfo",
] as const;

type NonPublicShopField = (typeof NON_PUBLIC_SHOP_FIELDS)[number];

/** A shop with every out-of-scope column removed. Because the fields are gone
 * from the *type* as well as the object, a view that tries to render one fails
 * to compile instead of leaking it. */
export type PublicShop = Omit<VendorShop, NonPublicShopField>;

/** Generic in the row shape so relations the caller included (category,
 * certifications) survive the strip with their types intact. */
export function toPublicShop<T extends Shop>(shop: T): Omit<T, NonPublicShopField> {
  const rest: Record<string, unknown> = { ...shop };
  for (const field of NON_PUBLIC_SHOP_FIELDS) delete rest[field];
  return rest as Omit<T, NonPublicShopField>;
}

/** Buyer-facing storefront lookup. Composes the shared rule in
 * lib/publicVisibility.ts rather than restating it, so this can never drift
 * from what lib/catalog.ts serves buyers, and hands back the stripped shape so
 * a caller cannot reach an out-of-scope column. */
export async function getPublicShopBySupplierSlug(slug: string): Promise<PublicShop | null> {
  const shop = await prisma.shop.findFirst({
    where: { ...publicShopWhere, supplier: { is: { slug, ...publicSupplierWhere } } },
    include: SHOP_INCLUDE,
  });
  return shop && toPublicShop(shop);
}

/** Whether this vendor's storefront is currently reachable by buyers. Drives
 * the "Live to buyers" indicator on the Shop Setup overview. */
export async function isShopPubliclyVisible(supplierId: string): Promise<boolean> {
  const count = await prisma.supplier.count({ where: { id: supplierId, ...publicSupplierWhere } });
  return count > 0;
}

/** The vendor's own catalog as buyers see it — same product filter the buyer
 * storefront uses, so Preview can't disagree with the real thing. */
export async function getPublicProductsForSupplier(supplierId: string) {
  return prisma.product.findMany({
    where: { supplierId, ...publicProductWhere },
    include: { category: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
}
