/*
  Warnings:

  - You are about to drop the column `employeeId` on the `SalesOrderAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToIds` on the `sales_orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SalesOrderAssignment" DROP CONSTRAINT "SalesOrderAssignment_employeeId_fkey";

-- AlterTable
ALTER TABLE "SalesOrderAssignment" DROP COLUMN "employeeId",
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "assignedToIds";
