-- Simplify SalesOrderAssignment to use User directly.
-- This migration has already been applied manually to the database.
-- It is recorded here so Prisma migration history matches the database.

-- Drop existing user foreign key so it can be recreated
-- with the desired referential action.
ALTER TABLE "SalesOrderAssignment"
DROP CONSTRAINT IF EXISTS "SalesOrderAssignment_userId_fkey";

-- Add assignment timestamps.
ALTER TABLE "SalesOrderAssignment"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- User is required for every assignment.
ALTER TABLE "SalesOrderAssignment"
ALTER COLUMN "userId" SET NOT NULL;

-- Indexes for assignment lookups.
CREATE INDEX "SalesOrderAssignment_salesOrderId_idx"
ON "SalesOrderAssignment"("salesOrderId");

CREATE INDEX "SalesOrderAssignment_userId_idx"
ON "SalesOrderAssignment"("userId");

-- Prevent assigning the same user to the same order twice.
CREATE UNIQUE INDEX "SalesOrderAssignment_salesOrderId_userId_key"
ON "SalesOrderAssignment"("salesOrderId", "userId");

-- Recreate the user relation.
ALTER TABLE "SalesOrderAssignment"
ADD CONSTRAINT "SalesOrderAssignment_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-------------------------------------------------------------------------------------------------------------------------------------------------
