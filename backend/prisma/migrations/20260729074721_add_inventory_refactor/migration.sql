/*
  Warnings:

  - The values [IN,OUT,TRANSFER_IN,TRANSFER_OUT,RESERVED,UNRESERVED] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `warehouseId` on the `inventories` table. All the data in the column will be lost.
  - Added the required column `stockAfter` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockBefore` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN');
ALTER TABLE "inventory_transactions" ALTER COLUMN "transactionType" TYPE "TransactionType_new" USING ("transactionType"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_warehouseId_fkey";

-- DropIndex
DROP INDEX "inventories_materialId_warehouseId_batchNo_serialNo_key";

-- DropIndex
DROP INDEX "inventories_warehouseId_idx";

-- AlterTable
ALTER TABLE "inventories" DROP COLUMN "warehouseId",
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "stockAfter" DECIMAL(15,3) NOT NULL,
ADD COLUMN     "stockBefore" DECIMAL(15,3) NOT NULL;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "leadDays" INTEGER,
ADD COLUMN     "reorderLevel" DECIMAL(15,3),
ADD COLUMN     "reorderQty" DECIMAL(15,3),
ADD COLUMN     "type" "MaterialType" NOT NULL DEFAULT 'RAW';
