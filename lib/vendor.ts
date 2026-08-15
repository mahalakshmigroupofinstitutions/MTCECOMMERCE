import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import type { ProductStatus } from "@/lib/generated/prisma/client";

/** Whether the vendor has cleared verification. Lives here, next to the data it
 * gates, so the data layer doesn't have to depend on the redirecting guards in
 * lib/vendorAccess.ts (which depend on this). */
export async function isApprovedVendor(supplierId: string): Promise<boolean> {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { onboardingStatus: true },
  });
  return supplier?.onboardingStatus === "APPROVED";
}

/** Relevance-filtered RFQ inbox: RFQs tied to one of the vendor's own products,
 * or to a category the vendor sells in. Includes this vendor's own quote (if
 * any) so the UI can show quoted/not-quoted/won/lost state.
 *
 * Marketplace RFQs are a post-verification privilege, and the gate lives here
 * rather than only on the page: the dashboard reads this too, so an unapproved
 * vendor must not even learn how much buyer demand exists. */
export async function getVendorRfqs(supplierId: string) {
  if (!(await isApprovedVendor(supplierId))) return [];

  const myProducts = await prisma.product.findMany({
    where: { supplierId },
    select: { id: true, categoryId: true },
  });
  const productIds = myProducts.map((p) => p.id);
  const categoryIds = [...new Set(myProducts.map((p) => p.categoryId))];
  if (productIds.length === 0 && categoryIds.length === 0) return [];

  return prisma.rFQ.findMany({
    where: {
      OR: [
        ...(productIds.length ? [{ productId: { in: productIds } }] : []),
        ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
      ],
    },
    include: {
      buyer: true,
      product: true,
      category: true,
      quotes: { where: { supplierId } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type VendorRfq = Awaited<ReturnType<typeof getVendorRfqs>>[number];

/** Null for an unapproved vendor, so the detail page 404s rather than exposing
 * a buyer's requirement (see getVendorRfqs). */
export async function getVendorRfqById(id: string, supplierId: string) {
  if (!(await isApprovedVendor(supplierId))) return null;

  return prisma.rFQ.findUnique({
    where: { id },
    include: {
      buyer: true,
      product: true,
      category: true,
      quotes: { where: { supplierId } },
    },
  });
}

export type VendorRfqDetail = NonNullable<Awaited<ReturnType<typeof getVendorRfqById>>>;

export async function getVendorProducts(supplierId: string) {
  return prisma.product.findMany({
    where: { supplierId },
    include: { category: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVendorProductById(id: string, supplierId: string) {
  return prisma.product.findFirst({ where: { id, supplierId } });
}

export interface VendorProductInput {
  title: string;
  categoryId: string;
  unit: string;
  price: number;
  moq: number;
  moqUnit: string;
  specs?: [string, string][];
  tiers?: [string, string][];
  description?: string;
}

export async function createVendorProduct(supplierId: string, input: VendorProductInput) {
  return prisma.product.create({
    data: { ...input, supplierId, slug: uniqueSlug(input.title) },
  });
}

export async function updateVendorProduct(id: string, supplierId: string, input: VendorProductInput) {
  const existing = await prisma.product.findFirst({ where: { id, supplierId } });
  if (!existing) throw new Error("Product not found or not owned by this vendor");
  return prisma.product.update({ where: { id }, data: input });
}

/** Vendor-driven listing visibility over the existing ProductStatus enum — no
 * separate approval workflow. Scoped by supplierId in the same statement, so a
 * guessed product id belonging to another vendor updates nothing. Publishing at
 * least one product is a precondition for the shop going LIVE
 * (canPublishShop in lib/vendorShop.ts). */
export async function setVendorProductStatus(id: string, supplierId: string, status: ProductStatus) {
  const { count } = await prisma.product.updateMany({ where: { id, supplierId }, data: { status } });
  if (count === 0) throw new Error("Product not found or not owned by this vendor");
}

export async function deleteVendorProduct(id: string, supplierId: string) {
  const existing = await prisma.product.findFirst({ where: { id, supplierId } });
  if (!existing) throw new Error("Product not found or not owned by this vendor");
  return prisma.product.delete({ where: { id } });
}

export async function getVendorOrders(supplierId: string) {
  return prisma.order.findMany({
    where: { supplierId },
    orderBy: { createdAt: "desc" },
    include: { product: true, buyer: true, steps: { orderBy: { position: "asc" } } },
  });
}

export type VendorOrderSummary = Awaited<ReturnType<typeof getVendorOrders>>[number];

export async function getVendorOrderById(id: string, supplierId: string) {
  return prisma.order.findFirst({
    where: { id, supplierId },
    include: { product: true, buyer: true, steps: { orderBy: { position: "asc" } } },
  });
}

export type VendorOrderDetail = NonNullable<Awaited<ReturnType<typeof getVendorOrderById>>>;
