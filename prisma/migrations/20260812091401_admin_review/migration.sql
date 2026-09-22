-- Additive-only migration for the admin verification queue.
-- Hand-written rather than generated: the live database currently contains
-- schema applied via `prisma db push` that isn't in prisma/schema.prisma
-- (Shop, ShopCertification, extra Product columns), so a generated diff would
-- try to DROP that work. Everything below only adds.

-- The review vocabulary (reviewNote, UNDER_REVIEW, CHANGES_REQUESTED) already
-- exists on the shared dev database; the IF NOT EXISTS guards make this
-- migration a no-op there while still standing up a fresh database correctly.
ALTER TYPE "SupplierOnboardingStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "SupplierOnboardingStatus" ADD VALUE IF NOT EXISTS 'CHANGES_REQUESTED';

ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
