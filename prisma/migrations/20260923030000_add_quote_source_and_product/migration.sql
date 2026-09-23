-- Backfills the Quote model changes from the quotation-invoice branch. That
-- branch shipped migrations for Invoice and DocumentCounter but not for Quote,
-- so these columns existed only where `prisma db push` had been run. Without
-- them the vendor RFQ inbox and vendor quotes pages fail to render.

-- A quote can now come from a product listing instead of an RFQ.
DO $$ BEGIN
    CREATE TYPE "QuoteSource" AS ENUM ('RFQ', 'PRODUCT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- productId is set only for PRODUCT-sourced quotes; verified records whether
-- the vendor has confirmed the price on an auto-generated one.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "source" "QuoteSource" NOT NULL DEFAULT 'RFQ';
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "verified" BOOLEAN NOT NULL DEFAULT false;

-- A PRODUCT-sourced quote has no RFQ behind it, so rfqId becomes nullable and
-- its foreign key has to be re-pointed to match.
ALTER TABLE "Quote" ALTER COLUMN "rfqId" DROP NOT NULL;
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_rfqId_fkey";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_rfqId_fkey"
    FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Quote_productId_idx" ON "Quote"("productId");

ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_productId_fkey";
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
