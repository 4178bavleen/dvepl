-- AlterEnum
-- Add REJECTED variant to DrawingStatus.
-- IF NOT EXISTS is safe: this is a no-op when the value already exists in the DB.
ALTER TYPE "DrawingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
