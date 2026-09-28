-- Additive-only migration: buyer address/contact fields. All nullable, so
-- existing Buyer rows remain valid without a backfill.

-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN "phoneCountryCode" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "country" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "pincode" TEXT;
