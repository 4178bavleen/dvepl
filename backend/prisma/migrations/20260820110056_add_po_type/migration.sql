-- CreateEnum
CREATE TYPE "PurchaseOrderType" AS ENUM ('JOB', 'STOCK');

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "poType" "PurchaseOrderType" NOT NULL DEFAULT 'STOCK';
