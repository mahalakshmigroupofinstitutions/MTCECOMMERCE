/* Unit tests for the pure Shop Setup completion rules.
 * Run with: npm test
 *
 * getShopCompletion is synchronous and side-effect free, so these exercise the
 * real logic with no database and no server involved. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_SHOP_STEPS,
  ON_HOLD_SHOP_STEPS,
  REQUIRED_SHOP_STEPS,
  getShopCompletion,
  toPublicShop,
} from "@/lib/vendorShop";
import type { Shop } from "@/lib/generated/prisma/client";

type ShopCompletionInput = Shop & { certifications: { id: string }[] };

/** A shop with every step's data absent, so each test can turn on exactly the
 * one field it is about. */
function shop(overrides: Partial<ShopCompletionInput> = {}): ShopCompletionInput {
  return {
    id: "shop_1",
    supplierId: "sup_1",
    name: "Test Shop",
    description: null,
    supportEmail: null,
    supportPhone: null,
    categoryId: null,
    logoUrl: null,
    bannerUrl: null,
    brandColor: null,
    businessEmail: null,
    website: null,
    hoursOpen: null,
    hoursClose: null,
    workingDays: [],
    addressLine: null,
    city: null,
    state: null,
    pincode: null,
    deliveryAreas: [],
    shippingMethods: [],
    deliveryCharges: null,
    deliveryEta: null,
    selfPickup: false,
    dispatchAddress: null,
    returnPolicy: null,
    refundPolicy: null,
    cancellationPolicy: null,
    warrantyInfo: null,
    linkedinUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    youtubeUrl: null,
    whatsappNumber: null,
    status: "DRAFT",
    completedSteps: [],
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    certifications: [],
    ...overrides,
  };
}

const socialOf = (input: ShopCompletionInput) => getShopCompletion(input).steps.social;

test("social is incomplete on an empty shop", () => {
  assert.equal(socialOf(shop()), false);
});

/* The regression: Business Details and Social Links share Shop.website, so a
 * company website used to complete the Social step by accident. */
test("a Business Details website alone does NOT complete Social", () => {
  const withWebsite = shop({ website: "https://acme.example/" });

  assert.equal(socialOf(withWebsite), false, "website must not satisfy the Social step");
  assert.ok(
    !getShopCompletion(withWebsite).completed.includes("social"),
    "social must not appear in completedSteps",
  );
});

test("each social field on its own completes Social", () => {
  const cases: Partial<ShopCompletionInput>[] = [
    { linkedinUrl: "https://linkedin.com/company/acme" },
    { facebookUrl: "https://facebook.com/acme" },
    { instagramUrl: "https://instagram.com/acme" },
    { youtubeUrl: "https://youtube.com/@acme" },
    { whatsappNumber: "+919876543210" },
  ];

  for (const only of cases) {
    const field = Object.keys(only)[0];
    assert.equal(socialOf(shop(only)), true, `${field} should complete the Social step`);
  }
});

test("a website alongside a real social link still completes Social", () => {
  const both = shop({ website: "https://acme.example/", linkedinUrl: "https://linkedin.com/company/acme" });
  assert.equal(socialOf(both), true);
});

test("removing the last social link un-completes Social even with a website present", () => {
  const linked = shop({ website: "https://acme.example/", linkedinUrl: "https://linkedin.com/company/acme" });
  assert.equal(socialOf(linked), true);

  const unlinked = shop({ website: "https://acme.example/" });
  assert.equal(socialOf(unlinked), false);
});

/* Guards the other half of the shared column: removing website from the Social
 * rule must not stop it counting toward Business Details. */
test("website is not required by the business step, and the business rule is unchanged", () => {
  const businessData = {
    businessEmail: "biz@acme.example",
    hoursOpen: "09:00",
    hoursClose: "18:00",
    workingDays: ["MON"],
    addressLine: "Plot 12",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411026",
  };

  assert.equal(getShopCompletion(shop(businessData)).steps.business, true, "business completes without a website");
  assert.equal(
    getShopCompletion(shop({ ...businessData, website: "https://acme.example/" })).steps.business,
    true,
    "business still completes with a website",
  );
});

test("a shop with a website but no social links is not fully complete", () => {
  const completion = getShopCompletion(
    shop({
      description: "Fasteners",
      supportEmail: "a@b.co",
      categoryId: "cat_1",
      logoUrl: "/vendor-logos/x/logo.png",
      businessEmail: "biz@acme.example",
      website: "https://acme.example/",
      hoursOpen: "09:00",
      hoursClose: "18:00",
      workingDays: ["MON"],
      addressLine: "Plot 12",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411026",
      deliveryAreas: ["Maharashtra"],
      shippingMethods: ["SURFACE"],
      deliveryEta: "3-5 days",
      returnPolicy: "7 days",
      refundPolicy: "10 days",
      cancellationPolicy: "Before dispatch",
    }),
  );

  // Every required step is satisfied, so the shop is publishable...
  assert.equal(completion.isComplete, true);
  // ...but the optional Social step must still read as outstanding.
  assert.equal(completion.steps.social, false);
  // Progress counts the active scope only: basics, branding and business are
  // done, certifications (optional, active) is not — 3 of 4.
  assert.equal(completion.percent, 75);
});

/* ---------------------------------------------------------------------------
 * Active scope: Delivery, Policies and Social are on hold. Their data is still
 * evaluated (`steps`), but they must not count toward progress or block a shop.
 * ------------------------------------------------------------------------- */

const MINIMUM_ACTIVE_SHOP = {
  description: "Fasteners",
  supportEmail: "a@b.co",
  categoryId: "cat_1",
  logoUrl: "/vendor-logos/x/logo.png",
  businessEmail: "biz@acme.example",
  hoursOpen: "09:00",
  hoursClose: "18:00",
  workingDays: ["MON"],
  addressLine: "Plot 12",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411026",
};

test("required steps are exactly basics, branding and business", () => {
  assert.deepEqual([...REQUIRED_SHOP_STEPS], ["basics", "branding", "business"]);
  assert.deepEqual([...ON_HOLD_SHOP_STEPS], ["delivery", "policies", "social"]);
  assert.deepEqual([...ACTIVE_SHOP_STEPS], ["basics", "branding", "business", "certifications"]);
});

test("basics + branding + business alone complete the shop", () => {
  const completion = getShopCompletion(shop(MINIMUM_ACTIVE_SHOP));

  assert.deepEqual(completion.missingRequired, []);
  assert.equal(completion.isComplete, true, "on-hold steps must not block readiness");
  assert.equal(completion.steps.delivery, false);
  assert.equal(completion.steps.policies, false);
});

test("on-hold steps never appear in completed or in progress", () => {
  const withOnHoldData = getShopCompletion(
    shop({
      ...MINIMUM_ACTIVE_SHOP,
      deliveryAreas: ["Maharashtra"],
      shippingMethods: ["SURFACE"],
      deliveryEta: "3-5 days",
      returnPolicy: "7 days",
      refundPolicy: "10 days",
      cancellationPolicy: "Before dispatch",
      linkedinUrl: "https://linkedin.com/company/acme",
    }),
  );

  // The rules still see the stored data...
  assert.equal(withOnHoldData.steps.delivery, true);
  assert.equal(withOnHoldData.steps.policies, true);
  assert.equal(withOnHoldData.steps.social, true);
  // ...but the active scope is what gets counted and shown.
  assert.deepEqual(withOnHoldData.completed, ["basics", "branding", "business"]);
  assert.equal(withOnHoldData.percent, 75);
});

/* ---------------------------------------------------------------------------
 * Buyer-facing exposure. Everything belonging to an on-hold step must be gone
 * from the payload a storefront view renders, even when the vendor saved it.
 * ------------------------------------------------------------------------- */

/** A shop carrying a distinctive value in every out-of-scope column, so a leak
 * shows up as the sentinel string appearing in the serialized payload. */
const SHOP_WITH_ON_HOLD_DATA = {
  ...MINIMUM_ACTIVE_SHOP,
  website: "https://leaked-website.example/",
  linkedinUrl: "https://linkedin.com/company/leaked-linkedin",
  facebookUrl: "https://facebook.com/leaked-facebook",
  instagramUrl: "https://instagram.com/leaked-instagram",
  youtubeUrl: "https://youtube.com/@leaked-youtube",
  whatsappNumber: "+919876500001",
  deliveryAreas: ["leaked-delivery-area"],
  shippingMethods: ["SURFACE"],
  deliveryCharges: "leaked-delivery-charges",
  deliveryEta: "leaked-delivery-eta",
  selfPickup: true,
  dispatchAddress: "leaked-dispatch-address",
  returnPolicy: "leaked-return-policy",
  refundPolicy: "leaked-refund-policy",
  cancellationPolicy: "leaked-cancellation-policy",
  warrantyInfo: "leaked-warranty-info",
};

const SENTINELS = [
  "leaked-website",
  "leaked-linkedin",
  "leaked-facebook",
  "leaked-instagram",
  "leaked-youtube",
  "919876500001",
  "leaked-delivery-area",
  "leaked-delivery-charges",
  "leaked-delivery-eta",
  "leaked-dispatch-address",
  "leaked-return-policy",
  "leaked-refund-policy",
  "leaked-cancellation-policy",
  "leaked-warranty-info",
];

test("toPublicShop drops every on-hold field, populated or not", () => {
  const publicShop = toPublicShop(shop(SHOP_WITH_ON_HOLD_DATA)) as Record<string, unknown>;

  for (const field of [
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
  ]) {
    assert.ok(!(field in publicShop), `${field} must not survive toPublicShop`);
  }

  const serialized = JSON.stringify(publicShop);
  for (const sentinel of SENTINELS) {
    assert.ok(!serialized.includes(sentinel), `${sentinel} leaked into the public payload`);
  }
});

test("toPublicShop keeps everything the storefront actually shows", () => {
  const publicShop = toPublicShop(
    shop({ ...SHOP_WITH_ON_HOLD_DATA, certifications: [{ id: "cert_1" }] }),
  );

  assert.equal(publicShop.name, "Test Shop");
  assert.equal(publicShop.description, "Fasteners");
  assert.equal(publicShop.supportEmail, "a@b.co");
  assert.equal(publicShop.logoUrl, "/vendor-logos/x/logo.png");
  assert.equal(publicShop.hoursOpen, "09:00");
  assert.deepEqual(publicShop.workingDays, ["MON"]);
  assert.equal(publicShop.city, "Pune");
  assert.equal(publicShop.status, "DRAFT");
  assert.deepEqual(publicShop.certifications, [{ id: "cert_1" }]);
});

test("stripping for display does not touch the source row", () => {
  const stored = shop(SHOP_WITH_ON_HOLD_DATA);
  toPublicShop(stored);

  assert.equal(stored.website, "https://leaked-website.example/", "the vendor's data must be untouched");
  assert.equal(stored.returnPolicy, "leaked-return-policy");
  assert.deepEqual(stored.deliveryAreas, ["leaked-delivery-area"]);
});

test("a missing required step still blocks, and certifications still don't", () => {
  const noLogo = getShopCompletion(shop({ ...MINIMUM_ACTIVE_SHOP, logoUrl: null }));
  assert.deepEqual(noLogo.missingRequired, ["branding"]);
  assert.equal(noLogo.isComplete, false);

  const certified = getShopCompletion(shop({ ...MINIMUM_ACTIVE_SHOP, certifications: [{ id: "cert_1" }] }));
  assert.equal(certified.isComplete, true);
  assert.equal(certified.percent, 100, "certifications is optional but still counts toward progress");
});
