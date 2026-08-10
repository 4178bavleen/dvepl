/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `DynamicRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DynamicRecord" DROP CONSTRAINT IF EXISTS "DynamicRecord_inventoryId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "DynamicRecord_inventoryId_key";

-- DropIndex
DROP INDEX IF EXISTS "DynamicRecord_moduleId_idx";

-- DropIndex
DROP INDEX IF EXISTS "DynamicRecord_inventoryId_idx";

-- AlterTable
ALTER TABLE "DynamicRecord" DROP COLUMN IF EXISTS "inventoryId";
