/*
  Warnings:

  - The values [DRAFT,CONFIRMED,IN_PRODUCTION,READY,DISPATCHED,CANCELLED] on the enum `SalesOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cancellationReason` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledById` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedAt` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedById` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDate` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `deliverySchedule` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `freight` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `gst` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderDate` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderNo` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the column `warranty` on the `sales_orders` table. All the data in the column will be lost.
  - You are about to drop the `stock_transfers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[dveplCode]` on the table `sales_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gstPercentage` to the `sales_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dveplCode` to the `sales_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partyName` to the `sales_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SalesOrderStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
ALTER TABLE "public"."sales_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sales_orders" ALTER COLUMN "status" TYPE "SalesOrderStatus_new" USING ("status"::text::"SalesOrderStatus_new");
ALTER TYPE "SalesOrderStatus" RENAME TO "SalesOrderStatus_old";
ALTER TYPE "SalesOrderStatus_new" RENAME TO "SalesOrderStatus";
DROP TYPE "public"."SalesOrderStatus_old";
ALTER TABLE "sales_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_cancelledById_fkey";

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_confirmedById_fkey";

-- DropForeignKey
ALTER TABLE "sales_orders" DROP CONSTRAINT "sales_orders_customerId_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_companyId_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_completedById_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_fromWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_inventoryId_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_materialId_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "stock_transfers" DROP CONSTRAINT "stock_transfers_toWarehouseId_fkey";

-- DropIndex
DROP INDEX "sales_order_items_salesOrderId_idx";

-- DropIndex
DROP INDEX "sales_orders_orderDate_idx";

-- DropIndex
DROP INDEX "sales_orders_orderNo_key";

-- AlterTable
ALTER TABLE "sales_order_items" ADD COLUMN     "gstPercentage" DECIMAL(5,2) NOT NULL,
ALTER COLUMN "unit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "cancellationReason",
DROP COLUMN "cancelledAt",
DROP COLUMN "cancelledById",
DROP COLUMN "confirmedAt",
DROP COLUMN "confirmedById",
DROP COLUMN "deliveryDate",
DROP COLUMN "deliverySchedule",
DROP COLUMN "freight",
DROP COLUMN "gst",
DROP COLUMN "orderDate",
DROP COLUMN "orderNo",
DROP COLUMN "paymentTerms",
DROP COLUMN "total",
DROP COLUMN "warranty",
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "caNo" TEXT,
ADD COLUMN     "contactDetails" TEXT,
ADD COLUMN     "deliveryMonthTarget" TEXT,
ADD COLUMN     "drawingApprovedDate" TIMESTAMP(3),
ADD COLUMN     "drawingConcernedPerson" TEXT,
ADD COLUMN     "drawingRemarks" TEXT,
ADD COLUMN     "drawingStatus" "DrawingStatus",
ADD COLUMN     "dveplCode" TEXT NOT NULL,
ADD COLUMN     "grandTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "inspectionField" TEXT,
ADD COLUMN     "orderConfirmDate" TIMESTAMP(3),
ADD COLUMN     "orderTakenById" TEXT,
ADD COLUMN     "partyName" TEXT NOT NULL,
ADD COLUMN     "poDate" TIMESTAMP(3),
ADD COLUMN     "sendNotification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "customerId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- DropTable
DROP TABLE "stock_transfers";

-- CreateTable
CREATE TABLE "sales_order_assignments" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "completedById" TEXT,
    "inventoryId" TEXT,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_order_assignments_userId_idx" ON "sales_order_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_assignments_salesOrderId_userId_key" ON "sales_order_assignments"("salesOrderId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_dveplCode_key" ON "sales_orders"("dveplCode");

-- CreateIndex
CREATE INDEX "sales_orders_orderTakenById_idx" ON "sales_orders"("orderTakenById");

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_orderTakenById_fkey" FOREIGN KEY ("orderTakenById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_assignments" ADD CONSTRAINT "sales_order_assignments_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_assignments" ADD CONSTRAINT "sales_order_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
