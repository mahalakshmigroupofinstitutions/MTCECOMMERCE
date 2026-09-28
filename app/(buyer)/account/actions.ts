"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyerId, clearBuyerSession } from "@/lib/session";
import { updateBuyerProfile, toggleSavedSupplier } from "@/lib/account";
import { isValidGstin, normalizeGstin } from "@/lib/gstin";
import { str } from "@/lib/formData";

// Registration lives in app/(buyer)/register/actions.ts (OTP-gated) and login
// lives in app/(buyer)/login/actions.ts (OTP-gated) — this file only keeps the
// actions specific to an already-authenticated buyer's account page. Neither
// flow creates a Buyer or session from a bare phone number anymore.

export async function logoutBuyer() {
  await clearBuyerSession();
  redirect("/");
}

export interface UpdateProfileState {
  error?: string;
}

/** Bound to a useActionState() hook on the account page's edit form, so a
 * validation failure can be reported back to the still-mounted client
 * component (staying in edit mode, form values intact) instead of a redirect
 * losing everything the buyer had just typed. Success still redirects, same
 * as before — that's the one case a full navigation back to the read-only
 * view is exactly what's wanted. Validation/normalization and the underlying
 * updateBuyerProfile() call are unchanged. */
export async function updateProfile(_prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect("/account");

  const country = str(formData, "country");
  const gstNumberRaw = str(formData, "gstNumber");
  const gstNumber = gstNumberRaw ? normalizeGstin(gstNumberRaw) : undefined;
  if (gstNumber && country === "India" && !isValidGstin(gstNumber)) {
    return { error: "That GSTIN doesn't look valid — double-check it or leave it blank." };
  }

  await updateBuyerProfile(buyerId!, {
    name: str(formData, "name"),
    companyName: str(formData, "companyName"),
    gstNumber,
    addressLine1: str(formData, "addressLine1"),
    addressLine2: str(formData, "addressLine2"),
    country,
    city: str(formData, "city"),
    state: str(formData, "state"),
    pincode: str(formData, "pincode"),
  });

  redirect("/account");
}

export async function toggleSaveSupplierAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const supplierSlug = str(formData, "supplierSlug") ?? "";
  // Defaults to the supplier's own page (where this action started), but a
  // caller like /saved-suppliers can pass its own path so removing a card
  // there doesn't bounce the buyer away from the list they're looking at.
  const backTo = str(formData, "backTo") ?? `/supplier/${supplierSlug}`;
  if (!supplierId) redirect(backTo);

  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect(`/login?next=${encodeURIComponent(backTo)}`);

  await toggleSavedSupplier(buyerId!, supplierId!);
  redirect(backTo);
}
