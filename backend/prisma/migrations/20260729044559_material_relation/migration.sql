/*
  Warnings:

  - You are about to drop the column `categoryId` on the `materials` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_categoryId_fkey";

-- DropIndex
DROP INDEX "materials_categoryId_idx";

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "categoryId",
ADD COLUMN     "category" TEXT;
