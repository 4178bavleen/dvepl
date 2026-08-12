-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "actionPermissions" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "fieldPermissions" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "pageAccess" JSONB NOT NULL DEFAULT '[]';
