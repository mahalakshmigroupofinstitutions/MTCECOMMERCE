-- Additive-only migration: buyer business profile, primary contact and
-- tax/compliance fields. All nullable, so existing Buyer rows remain valid
-- without a backfill (a null gstRegistered is read as "registered" when
-- gstNumber is already set).

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('RETAILER', 'WHOLESALER', 'CORPORATE', 'END_CONSUMER');

-- CreateEnum
CREATE TYPE "ProcurementFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'ANNUAL_CONTRACT');

-- AlterTable
ALTER TABLE "Buyer" ADD COLUMN "buyerType" "BuyerType";
ALTER TABLE "Buyer" ADD COLUMN "yearEstablished" INTEGER;
ALTER TABLE "Buyer" ADD COLUMN "procurementFrequency" "ProcurementFrequency";
ALTER TABLE "Buyer" ADD COLUMN "designation" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "businessEmail" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "panNumber" TEXT;
ALTER TABLE "Buyer" ADD COLUMN "gstRegistered" BOOLEAN;
