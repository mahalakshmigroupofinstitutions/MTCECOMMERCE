-- Backfills the expanded RFQ form fields, which reached the shared database
-- through `prisma db push` on the rfq-form-update branch and left no migration
-- behind. Every statement is guarded, so this is a no-op wherever db push has
-- already applied the change and a real migration on a fresh database.

-- Buyers can now save an RFQ before submitting it, so RfqStatus gains DRAFT.
-- Safe inside the migration transaction on PostgreSQL 12+; the new value is
-- not referenced until a later statement, in a later transaction.
ALTER TYPE "RfqStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

-- Unit of measure and the commercial, delivery and timeline terms the longer
-- form collects. All nullable, matching the optional fields in schema.prisma.
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "uom" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "targetPrice" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "concession" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "deliveryTimeline" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "deliveryMode" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "paymentTerms" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "specSheetUrl" TEXT;
ALTER TABLE "RFQ" ADD COLUMN IF NOT EXISTS "submissionDeadline" TIMESTAMP(3);
