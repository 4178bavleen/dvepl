/*
  Warnings:

  - Added the required column `stockAfter` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockBefore` to the `inventory_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inventory_transactions" ADD COLUMN     "stockAfter" DECIMAL(15,3) NOT NULL,
ADD COLUMN     "stockBefore" DECIMAL(15,3) NOT NULL;
