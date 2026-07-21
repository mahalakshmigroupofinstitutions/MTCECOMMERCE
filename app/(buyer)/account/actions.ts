"use server";

import { redirect } from "next/navigation";
import {
  getCurrentBuyerId,
  identifyBuyer,
  loginExistingBuyer,
  clearBuyerSession,
} from "@/lib/session";
import { updateBuyerProfile, toggleSavedSupplier } from "@/lib/account";
import { normalizePhone } from "@/lib/phone";
import { str } from "@/lib/formData";

function withError(next: string, error: string) {
  return `${next.includes("?") ? next + "&" : next + "?"}error=${error}`;
}

export async function registerBuyer(formData: FormData) {
  const name = str(formData, "name");
  const phone = normalizePhone(str(formData, "phone"));
  const next = str(formData, "next") ?? "/account";

  if (!name || !phone) {
    redirect(withError("/register", "identify"));
  }

  await identifyBuyer({
    phone: phone!,
    name: name!,
    companyName: str(formData, "companyName"),
    gstNumber: str(formData, "gstNumber"),
    city: str(formData, "city"),
  });

  redirect(next);
}

export async function loginBuyer(formData: FormData) {
  const phone = normalizePhone(str(formData, "phone"));
  const next = str(formData, "next") ?? "/account";

  if (!phone) {
    redirect(withError("/login", "identify"));
  }

  const buyer = await loginExistingBuyer(phone!);
  if (!buyer) {
    redirect(`/register?next=${encodeURIComponent(next)}&error=notfound`);
  }

  redirect(next);
}

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
  });

  redirect("/account");
}

export async function toggleSaveSupplierAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const supplierSlug = str(formData, "supplierSlug") ?? "";
  const backTo = `/supplier/${supplierSlug}`;
  if (!supplierId) redirect(backTo);

  const buyerId = await getCurrentBuyerId();
  if (!buyerId) redirect(`/login?next=${encodeURIComponent(backTo)}`);

  await toggleSavedSupplier(buyerId!, supplierId!);
  redirect(backTo);
}
