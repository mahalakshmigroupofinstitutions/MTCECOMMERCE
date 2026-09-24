-- Adds a human-readable quote number, generated the same way Invoice.invoiceNumber
-- is (see 20260923000000_add_paid_invoices): via the shared DocumentCounter table,
-- one counter per (docType, year). Nullable since existing rows predate this field.

ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "quoteNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
