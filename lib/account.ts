import { prisma } from "@/lib/prisma";

export interface UpdateBuyerProfileInput {
  name?: string;
  companyName?: string;
  gstNumber?: string;
  city?: string;
}

export async function updateBuyerProfile(buyerId: string, input: UpdateBuyerProfileInput) {
  return prisma.buyer.update({ where: { id: buyerId }, data: input });
}

export async function getSavedSuppliers(buyerId: string) {
  const saved = await prisma.savedSupplier.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: { supplier: true },
  });
  return saved.map((s) => s.supplier);
}

export async function isSupplierSaved(buyerId: string, supplierId: string) {
  const row = await prisma.savedSupplier.findUnique({
    where: { buyerId_supplierId: { buyerId, supplierId } },
  });
  return !!row;
}

/** Toggles a saved-supplier bookmark and returns the resulting saved state. */
export async function toggleSavedSupplier(buyerId: string, supplierId: string) {
  const existing = await prisma.savedSupplier.findUnique({
    where: { buyerId_supplierId: { buyerId, supplierId } },
  });
  if (existing) {
    await prisma.savedSupplier.delete({ where: { buyerId_supplierId: { buyerId, supplierId } } });
    return false;
  }
  await prisma.savedSupplier.create({ data: { buyerId, supplierId } });
  return true;
}
