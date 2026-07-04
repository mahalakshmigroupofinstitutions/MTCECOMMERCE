"use server";

import { redirect } from "next/navigation";
import { getCurrentBuyerId } from "@/lib/session";
import { updateBuyerProfile, toggleSavedSupplier } from "@/lib/account";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export async function updateProfile(formData: FormData) {
  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect("/account");

  await updateBuyerProfile(buyerId!, {
    name: str(formData, "name"),
    companyName: str(formData, "companyName"),
    gstNumber: str(formData, "gstNumber"),
    city: str(formData, "city"),
  });

  redirect("/account");
}

export async function toggleSaveSupplierAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const supplierSlug = str(formData, "supplierSlug") ?? "";
  const backTo = `/supplier/${supplierSlug}`;
  if (!supplierId) redirect(backTo);

  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect(`/account?next=${encodeURIComponent(backTo)}`);

  await toggleSavedSupplier(buyerId!, supplierId!);
  redirect(backTo);
}
