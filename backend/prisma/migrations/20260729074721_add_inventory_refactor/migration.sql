/*
  NOTE: Reconciled on 2026-07-29.

  Warnings:

  - You are about to drop the column `warehouseId` on the `inventories` table. All the data in the column will be lost.

  The enum rename (TransactionType -> InventoryTransactionType) and the
  `inventory_transactions.stockAfter` / `stockBefore` / `materials.leadDays`
  / `reorderLevel` / `reorderQty` / `type` columns had already been applied
  to the database out-of-band under different names before this migration
  file existed, so those statements were removed to avoid conflicts. Only
  the still-pending removal of `inventories.warehouseId` remains below.
*/

-- DropForeignKey
ALTER TABLE "inventories" DROP CONSTRAINT "inventories_warehouseId_fkey";

-- DropIndex
DROP INDEX "inventories_materialId_warehouseId_batchNo_serialNo_key";

-- DropIndex
DROP INDEX "inventories_warehouseId_idx";

-- AlterTable
ALTER TABLE "inventories" DROP COLUMN "warehouseId";
