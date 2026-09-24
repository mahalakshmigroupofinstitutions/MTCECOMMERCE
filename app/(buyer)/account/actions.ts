"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyerId, clearBuyerSession } from "@/lib/session";
import { updateBuyerProfile, toggleSavedSupplier } from "@/lib/account";
import { str } from "@/lib/formData";

// Registration lives in app/(buyer)/register/actions.ts (OTP-gated) and login
// lives in app/(buyer)/login/actions.ts (OTP-gated) — this file only keeps the
// actions specific to an already-authenticated buyer's account page. Neither
// flow creates a Buyer or session from a bare phone number anymore.

export async function logoutBuyer() {
  await clearBuyerSession();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect("/account");

  await updateBuyerProfile(buyerId!, {
    name: str(formData, "name"),
    companyName: str(formData, "companyName"),
    gstNumber: str(formData, "gstNumber"),
    city: str(formData, "city"),
    state: str(formData, "state"),
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
