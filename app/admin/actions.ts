"use server";

import { redirect } from "next/navigation";
import { str, withErrorParam } from "@/lib/formData";
import { getCurrentAdminId, loginAdmin, clearAdminSession } from "@/lib/adminSession";
import {
  approveVendor,
  rejectVendor,
  requestChanges,
  claimVendorForReview,
} from "@/lib/adminReview";

export async function loginAdminAction(formData: FormData) {
  const email = str(formData, "email")?.toLowerCase();
  const password = str(formData, "password");

  if (!email || !password) {
    redirect(withErrorParam("/admin/login", "invalid"));
  }

  const admin = await loginAdmin({ email: email!, password: password! });
  if (!admin) {
    redirect(withErrorParam("/admin/login", "invalid"));
  }

  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin/login");
}

/** Shared guard for the decision actions below. */
async function requireAdminId(supplierId: string | undefined) {
  const adminId = await getCurrentAdminId();
  if (!adminId) redirect("/admin/login");
  if (!supplierId) redirect("/admin");
  return adminId;
}

export async function claimVendorAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const adminId = await requireAdminId(supplierId);

  await claimVendorForReview(supplierId!, adminId);
  redirect(`/admin/vendors/${supplierId}`);
}

export async function approveVendorAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const adminId = await requireAdminId(supplierId);

  await approveVendor(supplierId!, adminId, str(formData, "note"));
  redirect(`/admin/vendors/${supplierId}`);
}

export async function rejectVendorAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const adminId = await requireAdminId(supplierId);

  const note = str(formData, "note");
  if (!note) {
    redirect(withErrorParam(`/admin/vendors/${supplierId}`, "note"));
  }

  await rejectVendor(supplierId!, adminId, note!);
  redirect(`/admin/vendors/${supplierId}`);
}

export async function requestChangesAction(formData: FormData) {
  const supplierId = str(formData, "supplierId");
  const adminId = await requireAdminId(supplierId);

  const note = str(formData, "note");
  if (!note) {
    redirect(withErrorParam(`/admin/vendors/${supplierId}`, "note"));
  }

  await requestChanges(supplierId!, adminId, note!);
  redirect(`/admin/vendors/${supplierId}`);
}
