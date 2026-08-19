-- Add stage-wise assignment to SalesOrderAssignment.
-- `stage` is NULL for whole-order assignments (all stages).

ALTER TABLE "SalesOrderAssignment" ADD COLUMN "stage" TEXT;

DROP INDEX IF EXISTS "SalesOrderAssignment_salesOrderId_userId_key";

CREATE UNIQUE INDEX "SalesOrderAssignment_salesOrderId_userId_stage_key"
ON "SalesOrderAssignment"("salesOrderId", "userId", "stage");

CREATE INDEX "SalesOrderAssignment_salesOrderId_stage_idx"
ON "SalesOrderAssignment"("salesOrderId", "stage");