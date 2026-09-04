-- AlterEnum
ALTER TYPE "NotificationProvider" ADD VALUE 'AISENSY';

-- AlterTable
ALTER TABLE "NotificationConfiguration" ADD COLUMN "whatsappCampaignName" TEXT,
ADD COLUMN "whatsappNumber" TEXT;
