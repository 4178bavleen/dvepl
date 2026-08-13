-- AlterEnum
ALTER TYPE "DrawingStatus" ADD VALUE 'DRAFT';
ALTER TYPE "DrawingStatus" ADD VALUE 'SUBMITTED';
ALTER TYPE "DrawingStatus" ADD VALUE 'APPROVED';

-- AlterTable
ALTER TABLE "engineering_drawings" ADD COLUMN "rejectionReason" TEXT;
