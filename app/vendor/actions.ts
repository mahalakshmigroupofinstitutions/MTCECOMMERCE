"use server";

import { redirect } from "next/navigation";
import { identifyVendor, getCurrentSupplierId, clearVendorSession } from "@/lib/vendorSession";
import { createQuote } from "@/lib/rfq";
import {
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorOrderById,
} from "@/lib/vendor";
import { advanceOrderStep } from "@/lib/orders";
import { str } from "@/lib/formData";

function parseLines(text: string | undefined, sep: string): [string, string][] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(sep);
      if (i < 0) return [line, ""] as [string, string];
      return [line.slice(0, i).trim(), line.slice(i + sep.length).trim()] as [string, string];
    });
}

export async function identifyVendorAndContinue(formData: FormData) {
  const phoneRaw = str(formData, "phone") ?? "";
  const digits = phoneRaw.replace(/\D/g, "");
  const name = str(formData, "name");
  const city = str(formData, "city");
  const next = str(formData, "next") ?? "/vendor";

  if (digits.length < 8 || !name || !city) {
    redirect(`${next.includes("?") ? next + "&" : next + "?"}error=identify`);
  }

  await identifyVendor({
    phone: digits.length === 10 ? `+91${digits}` : `+${digits}`,
    name: name!,
    city: city!,
  });

  redirect(next);
}

export async function vendorLogout() {
  await clearVendorSession();
  redirect("/vendor/login");
}

export async function submitVendorQuote(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const rfqId = str(formData, "rfqId");
  const priceRaw = str(formData, "price");
  if (!rfqId || !priceRaw) redirect(`/vendor/rfqs/${rfqId}?error=1`);

  const validUntilRaw = str(formData, "validUntil");

  await createQuote({
    rfqId: rfqId!,
    supplierId: supplierId!,
    price: Math.round(Number(priceRaw)),
    unit: str(formData, "unit") ?? "unit",
    moq: str(formData, "moq"),
    delivery: str(formData, "delivery"),
    payment: str(formData, "payment"),
    validUntil: validUntilRaw ? new Date(validUntilRaw) : undefined,
    note: str(formData, "note"),
  });

  redirect(`/vendor/rfqs/${rfqId}`);
}

export async function saveVendorProduct(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const productId = str(formData, "productId");
  const title = str(formData, "title");
  const categoryId = str(formData, "categoryId");
  const unit = str(formData, "unit");
  const priceRaw = str(formData, "price");
  const moqRaw = str(formData, "moq");
  const moqUnit = str(formData, "moqUnit");

  if (!title || !categoryId || !unit || !priceRaw || !moqRaw || !moqUnit) {
    redirect(`${productId ? `/vendor/products/${productId}/edit` : "/vendor/products/new"}?error=1`);
  }

  const input = {
    title: title!,
    categoryId: categoryId!,
    unit: unit!,
    price: Math.round(Number(priceRaw)),
    moq: Math.round(Number(moqRaw)),
    moqUnit: moqUnit!,
    specs: parseLines(str(formData, "specs"), ":"),
    tiers: parseLines(str(formData, "tiers"), "|"),
    description: str(formData, "description"),
  };

  if (productId) {
    await updateVendorProduct(productId, supplierId!, input);
  } else {
    await createVendorProduct(supplierId!, input);
  }

  redirect("/vendor/products");
}

export async function deleteVendorProductAction(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const productId = str(formData, "productId");
  if (!productId) redirect("/vendor/products");

  try {
    await deleteVendorProduct(productId!, supplierId!);
  } catch {
    redirect("/vendor/products?error=delete");
  }

  redirect("/vendor/products");
}

export async function advanceVendorOrderStep(formData: FormData) {
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login");

  const orderId = str(formData, "orderId");
  if (!orderId) redirect("/vendor/orders");

  const order = await getVendorOrderById(orderId!, supplierId!);
  if (!order) redirect("/vendor/orders");

  const activeKey = order.steps.find((s) => s.active)?.key;
  if (activeKey === "production" || activeKey === "shipped") {
    await advanceOrderStep(orderId!);
  }

  redirect(`/vendor/orders/${orderId}`);
}
