import { redirect } from "next/navigation";
import { ProductForm } from "@/components/vendor/ProductForm";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getCategories } from "@/lib/catalog";

export const revalidate = 0;

export default async function NewVendorProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect("/vendor/login?next=/vendor/products/new");

  const categories = await getCategories();

  return <ProductForm categories={categories} error={error === "1"} />;
}
