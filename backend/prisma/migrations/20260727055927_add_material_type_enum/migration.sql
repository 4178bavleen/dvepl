-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('RAW', 'SEMI_FINISHED', 'FINISHED', 'CONSUMABLE');

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "type" "MaterialType" NOT NULL DEFAULT 'RAW';
