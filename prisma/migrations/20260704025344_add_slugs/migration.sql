-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_slug_key" ON "Supplier"("slug");

