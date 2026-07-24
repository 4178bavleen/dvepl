/*
  Warnings:

  - You are about to drop the column `preferredVendorId` on the `materials` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('RAW', 'FINISHED', 'SEMI_FINISHED', 'CONSUMABLE');

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "preferredVendorId",
ADD COLUMN     "leadDays" INTEGER,
ADD COLUMN     "reorderLevel" DECIMAL(15,3),
ADD COLUMN     "reorderQty" DECIMAL(15,3),
ADD COLUMN     "type" "MaterialType" NOT NULL DEFAULT 'RAW';
