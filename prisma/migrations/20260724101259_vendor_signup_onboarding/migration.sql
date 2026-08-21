-- CreateEnum
CREATE TYPE "SupplierOnboardingStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupplierBusinessType" AS ENUM ('MANUFACTURER', 'WHOLESALER', 'DISTRIBUTOR', 'RETAILER', 'IMPORTER_EXPORTER', 'CONTRACTOR');

-- CreateEnum
CREATE TYPE "SupplierDocumentType" AS ENUM ('GST_CERTIFICATE', 'PAN_CARD', 'BUSINESS_REGISTRATION', 'MSME_CERTIFICATE', 'AUTHORIZED_PERSON_ID');

-- CreateEnum
CREATE TYPE "SupplierAccountType" AS ENUM ('CURRENT', 'SAVINGS');

-- CreateEnum
CREATE TYPE "SupplierBankVerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessCategoryId" TEXT,
ADD COLUMN     "businessType" "SupplierBusinessType",
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStatus" "SupplierOnboardingStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "SupplierDocument" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" "SupplierDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierBankDetail" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountType" "SupplierAccountType" NOT NULL,
    "upiId" TEXT,
    "verificationStatus" "SupplierBankVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierBankDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierDocument_supplierId_idx" ON "SupplierDocument"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierBankDetail_supplierId_key" ON "SupplierBankDetail"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBankDetail" ADD CONSTRAINT "SupplierBankDetail_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

