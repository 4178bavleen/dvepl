-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('ORDER_CONFIRMED', 'PO_READY', 'DRAWING_ASSIGNED', 'DRAWING_SENT', 'REVISION_REQUIRED', 'DRAWING_APPROVED', 'PO_PLACED', 'INVENTORY_FOLLOW_UP', 'PRODUCTION_FOLLOW_UP');

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "workflowStage" "WorkflowStage" NOT NULL DEFAULT 'ORDER_CONFIRMED',
ADD COLUMN     "workflowUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "WorkflowEvent" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "stage" "WorkflowStage" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowEvent_salesOrderId_idx" ON "WorkflowEvent"("salesOrderId");

-- CreateIndex
CREATE INDEX "WorkflowEvent_createdAt_idx" ON "WorkflowEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkflowEvent" ADD CONSTRAINT "WorkflowEvent_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
