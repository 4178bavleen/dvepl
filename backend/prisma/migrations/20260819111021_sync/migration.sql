-- DropIndex
DROP INDEX "SalesOrderAssignment_salesOrderId_stage_idx";

-- AlterTable
ALTER TABLE "drawing_revisions" ALTER COLUMN "updatedAt" DROP DEFAULT;
