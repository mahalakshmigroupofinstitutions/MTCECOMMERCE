/* Presentation metadata for the Shop Setup wizard. Pure data, no "use client"
 * and no server imports, so both Server and Client Components can read it.
 * The step list, required-step list and completion logic all stay in
 * lib/vendorShop.ts — this file only decides how they read. */
import type { IconName } from "@/components/icons/Icon";
import type { ShopSetupStep } from "@/lib/vendorShop";

export interface ShopStepMeta {
  label: string;
  description: string;
  icon: IconName;
}

export const SHOP_STEP_META: Record<ShopSetupStep, ShopStepMeta> = {
  basics: { label: "Basic information", description: "Shop name, category and support contacts", icon: "doc" },
  branding: { label: "Branding", description: "Logo, cover image and brand colour", icon: "camera" },
  business: { label: "Business details", description: "Hours, working days and address", icon: "building" },
  delivery: { label: "Delivery", description: "Areas served, shipping and dispatch", icon: "truck" },
  policies: { label: "Policies", description: "Returns, refunds, cancellation and warranty", icon: "shield" },
  certifications: { label: "Certifications", description: "ISO, MSME, brochures and portfolios", icon: "verified" },
  social: { label: "Social links", description: "LinkedIn, Instagram, WhatsApp and more", icon: "chat" },
};

/** Display host for the public storefront URL. One constant so pointing the
 * marketplace at another domain is a single-line change. */
export const STORE_URL_HOST = "mtcecommerce.com";

/* Vendor-facing text for every error code lib/vendorShop.ts can return. Codes
 * arrive as ?error= after a Server Action redirect; anything unmapped falls back
 * to GENERIC_ERROR so an internal code is never shown raw. */
export const SHOP_SETUP_ERRORS: Record<string, string> = {
  // basics
  name: "Please enter a shop name.",
  nameLength: "That shop name is too long. Please keep it under 200 characters.",
  descriptionLength: "That description is too long. Please keep it under 5,000 characters.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number, for example 98765 43210.",
  category: "Please choose a shop category from the list.",
  slug: "Store URLs need at least 3 letters or numbers.",
  slugTaken: "That store URL is already taken. Please try another.",
  // branding
  imageType: "Images must be a PNG, JPG or WebP file.",
  imageSize: "Images must be smaller than 5 MB.",
  color: "Please pick a valid brand colour.",
  // business & delivery
  pincode: "Please enter a valid 6-digit PIN code.",
  hours: "Please enter opening and closing times in 24-hour format, for example 09:00.",
  workingDays: "Please choose your working days from the list.",
  website: "Please enter a valid website address.",
  addressLength: "That address is too long.",
  shippingMethod: "Please choose shipping methods from the list.",
  tooManyAreas: "Please list no more than 50 delivery areas.",
  areaLength: "One of those delivery areas is too long.",
  chargesLength: "That delivery charge description is too long.",
  etaLength: "That delivery estimate is too long.",
  policyLength: "That policy is too long. Please keep it under 5,000 characters.",
  // certifications
  type: "Please choose a certification type.",
  fileMissing: "Please choose a file to upload.",
  fileType: "Certifications must be a PDF, PNG, JPG or WebP file.",
  fileSize: "Certifications must be smaller than 5 MB.",
  titleLength: "That certification title is too long.",
  tooMany: "You've reached the maximum of 20 certifications.",
  notFound: "We couldn't find that item. It may have already been removed.",
  // social
  linkedinUrl: "Please enter a valid LinkedIn address.",
  facebookUrl: "Please enter a valid Facebook address.",
  instagramUrl: "Please enter a valid Instagram address.",
  youtubeUrl: "Please enter a valid YouTube address.",
  whatsapp: "Please enter a valid WhatsApp number.",
  // publishing
  notApproved: "Your shop can go live once your vendor verification is approved.",
  setupIncomplete: "Please complete every required Shop Setup step before publishing.",
  noPublishedProduct: "Publish at least one product before taking your shop live.",
};

export const GENERIC_ERROR = "Something went wrong while saving your shop details. Please try again.";
