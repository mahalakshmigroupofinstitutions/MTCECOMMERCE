-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('DRAFT', 'INCOMPLETE', 'READY', 'LIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ShopCertificationType" AS ENUM ('ISO', 'MSME', 'BIS', 'AUTHORIZED_DEALER', 'COMPANY_BROCHURE', 'PROJECT_PORTFOLIO', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SupplierOnboardingStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "SupplierOnboardingStatus" ADD VALUE 'CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "certificateUrl" TEXT,
ADD COLUMN     "datasheetUrl" TEXT,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "gstPercent" INTEGER,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "leadTime" TEXT,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "stock" INTEGER,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- Backfill intent (hand-edited, do not regenerate):
-- The column is ADDed with DEFAULT 'PUBLISHED' so every pre-existing product
-- keeps its current buyer-facing visibility — this migration must be a no-op
-- for the live catalog. The default is then flipped to 'DRAFT' so that every
-- product created from here on starts hidden, and vendor approval alone never
-- makes a listing public. Final column default matches Product.status in
-- schema.prisma (@default(DRAFT)), so no schema drift.
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "reviewNote" TEXT;

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "categoryId" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "brandColor" TEXT,
    "businessEmail" TEXT,
    "website" TEXT,
    "hoursOpen" TEXT,
    "hoursClose" TEXT,
    "workingDays" TEXT[],
    "addressLine" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "deliveryAreas" TEXT[],
    "shippingMethods" TEXT[],
    "deliveryCharges" TEXT,
    "deliveryEta" TEXT,
    "selfPickup" BOOLEAN NOT NULL DEFAULT false,
    "dispatchAddress" TEXT,
    "returnPolicy" TEXT,
    "refundPolicy" TEXT,
    "cancellationPolicy" TEXT,
    "warrantyInfo" TEXT,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "whatsappNumber" TEXT,
    "status" "ShopStatus" NOT NULL DEFAULT 'DRAFT',
    "completedSteps" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopCertification" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "type" "ShopCertificationType" NOT NULL,
    "title" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopCertification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_supplierId_key" ON "Shop"("supplierId");

-- CreateIndex
CREATE INDEX "Shop_status_idx" ON "Shop"("status");

-- CreateIndex
CREATE INDEX "ShopCertification_shopId_idx" ON "ShopCertification"("shopId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_supplierId_sku_key" ON "Product"("supplierId", "sku");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopCertification" ADD CONSTRAINT "ShopCertification_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
