/*
  Warnings:

  - You are about to drop the column `categoryId` on the `materials` table. All the data in the column will be lost.
  - Added the required column `category` to the `materials` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_categoryId_fkey";

-- DropIndex
DROP INDEX "materials_categoryId_idx";

-- AlterTable
ALTER TABLE "inventories" ALTER COLUMN "warehouseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "materials_category_idx" ON "materials"("category");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
