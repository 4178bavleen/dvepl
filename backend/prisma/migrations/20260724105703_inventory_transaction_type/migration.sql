/*
  Warnings:

  - Changed the type of `transactionType` on the `inventory_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'RETURN');

-- AlterTable
ALTER TABLE "inventory_transactions" DROP COLUMN "transactionType",
ADD COLUMN     "transactionType" "InventoryTransactionType" NOT NULL;

-- DropEnum
DROP TYPE "TransactionType";
