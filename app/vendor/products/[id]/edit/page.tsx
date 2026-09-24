import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/vendor/ProductForm";
import { getCurrentSupplierId } from "@/lib/vendorSession";
import { getVendorProductById } from "@/lib/vendor";
import { getCategories } from "@/lib/catalog";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/localFileStorage";

export const revalidate = 0;

export default async function EditVendorProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supplierId = await getCurrentSupplierId();
  if (!supplierId) redirect(`/vendor/login?next=/vendor/products/${id}/edit`);

  const [product, categories] = await Promise.all([getVendorProductById(id, supplierId), getCategories()]);
  if (!product) notFound();

  return (
    <ProductForm
      categories={categories}
      imageAccept={ALLOWED_IMAGE_TYPES.join(",")}
      maxImageMb={Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}
      product={product}
      error={error}
    />
  );
}
