/*
  Warnings:

  - You are about to drop the `sales_order_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "sales_order_assignments" DROP CONSTRAINT "sales_order_assignments_salesOrderId_fkey";

-- DropForeignKey
ALTER TABLE "sales_order_assignments" DROP CONSTRAINT "sales_order_assignments_userId_fkey";

-- DropTable
DROP TABLE "sales_order_assignments";

-- CreateTable
CREATE TABLE "SalesOrderAssignment" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "SalesOrderAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrderAssignment_salesOrderId_employeeId_key" ON "SalesOrderAssignment"("salesOrderId", "employeeId");

-- AddForeignKey
ALTER TABLE "SalesOrderAssignment" ADD CONSTRAINT "SalesOrderAssignment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderAssignment" ADD CONSTRAINT "SalesOrderAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderAssignment" ADD CONSTRAINT "SalesOrderAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
