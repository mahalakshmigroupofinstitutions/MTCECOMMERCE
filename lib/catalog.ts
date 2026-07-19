import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];
export type SupplierRow = Awaited<ReturnType<typeof getFeaturedSuppliers>>[number];
export type ProductWithRelations = Awaited<ReturnType<typeof getTopProducts>>[number];

export async function getFeaturedSuppliers(limit = 4) {
  return prisma.supplier.findMany({
    orderBy: { trustScore: "desc" },
    take: limit,
  });
}

export async function getCatalogStats() {
  const [categories, suppliers, products] = await Promise.all([
    prisma.category.count(),
    prisma.supplier.count(),
    prisma.product.count(),
  ]);
  return { categories, suppliers, products };
}

export async function getAllSuppliers() {
  return prisma.supplier.findMany({ orderBy: { name: "asc" } });
}

export async function getTopProducts(limit = 4) {
  return prisma.product.findMany({
    orderBy: { rating: "desc" },
    take: limit,
    include: { supplier: true, category: true },
  });
}

export type ProductSort = "best" | "price_asc" | "price_desc";

export interface ProductSearchFilters {
  q?: string;
  category?: string;
  verifiedOnly?: boolean;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
}

const SORT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  best: { rating: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

export async function searchProducts(filters: ProductSearchFilters) {
  const supplierFilter: Prisma.SupplierWhereInput = {};
  if (filters.verifiedOnly) supplierFilter.verified = true;
  if (filters.city) supplierFilter.city = { contains: filters.city, mode: "insensitive" };

  const where: Prisma.ProductWhereInput = {
    ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {}),
    ...(filters.category ? { category: { slug: filters.category } } : {}),
    ...(Object.keys(supplierFilter).length ? { supplier: { is: supplierFilter } } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: SORT_ORDER[filters.sort ?? "best"],
      include: { supplier: true, category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

/** Product counts per category id and per supplier city, for the search filter sidebar. */
export async function getSearchFacets() {
  const products = await prisma.product.findMany({
    select: { categoryId: true, supplier: { select: { city: true } } },
  });
  const byCategory = new Map<string, number>();
  const byCity = new Map<string, number>();
  for (const p of products) {
    byCategory.set(p.categoryId, (byCategory.get(p.categoryId) ?? 0) + 1);
    byCity.set(p.supplier.city, (byCity.get(p.supplier.city) ?? 0) + 1);
  }
  return { byCategory, byCity };
}

export async function getDistinctCities() {
  const suppliers = await prisma.supplier.findMany({
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return suppliers.map((s) => s.city);
}

export async function getSupplierBySlug(slug: string) {
  return prisma.supplier.findUnique({
    where: { slug },
    include: { products: { include: { category: true, supplier: true } } },
  });
}

export type SupplierWithProducts = NonNullable<Awaited<ReturnType<typeof getSupplierBySlug>>>;

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { supplier: true, category: true },
  });
}
