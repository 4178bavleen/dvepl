-- AlterTable
ALTER TABLE "purchase_order_revisions" ADD COLUMN     "salesOrderId" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "linkedSalesOrderId" TEXT;

-- CreateIndex
CREATE INDEX "purchase_order_revisions_salesOrderId_idx" ON "purchase_order_revisions"("salesOrderId");

-- CreateIndex
CREATE INDEX "purchase_orders_linkedSalesOrderId_idx" ON "purchase_orders"("linkedSalesOrderId");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_linkedSalesOrderId_fkey" FOREIGN KEY ("linkedSalesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_revisions" ADD CONSTRAINT "purchase_order_revisions_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
