/*
  Warnings:

  - A unique constraint covering the columns `[inventoryId]` on the table `DynamicRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DynamicRecord" ADD COLUMN     "inventoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DynamicRecord_inventoryId_key" ON "DynamicRecord"("inventoryId");

-- CreateIndex
CREATE INDEX "DynamicRecord_moduleId_idx" ON "DynamicRecord"("moduleId");

-- CreateIndex
CREATE INDEX "DynamicRecord_inventoryId_idx" ON "DynamicRecord"("inventoryId");

-- AddForeignKey
ALTER TABLE "DynamicRecord" ADD CONSTRAINT "DynamicRecord_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
