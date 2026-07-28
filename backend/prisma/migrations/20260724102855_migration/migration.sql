-- AlterTable
ALTER TABLE "inventories" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "preferredVendorId" TEXT;

-- CreateIndex
CREATE INDEX "materials_preferredVendorId_idx" ON "materials"("preferredVendorId");

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_preferredVendorId_fkey" FOREIGN KEY ("preferredVendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
