-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_preferredVendorId_fkey" FOREIGN KEY ("preferredVendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
