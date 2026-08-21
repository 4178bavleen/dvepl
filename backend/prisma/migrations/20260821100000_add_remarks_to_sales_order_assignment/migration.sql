-- Add optional remarks to stage-wise sales order assignments.
-- One remark per stage group; stored on each assignment row of that group.

ALTER TABLE "SalesOrderAssignment" ADD COLUMN "remarks" TEXT;
