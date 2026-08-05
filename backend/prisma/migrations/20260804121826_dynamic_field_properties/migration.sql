-- AlterTable
ALTER TABLE "DynamicField" ADD COLUMN     "defaultValue" JSONB,
ADD COLUMN     "filterable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "placeholder" TEXT,
ADD COLUMN     "searchable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "table" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;
