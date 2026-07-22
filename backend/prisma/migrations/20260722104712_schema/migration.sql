/*
  Warnings:

  - You are about to drop the `vendor_revisions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "vendor_revisions" DROP CONSTRAINT "vendor_revisions_createdById_fkey";

-- DropForeignKey
ALTER TABLE "vendor_revisions" DROP CONSTRAINT "vendor_revisions_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_companyId_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_createdById_fkey";

-- DropTable
DROP TABLE "vendor_revisions";

-- DropTable
DROP TABLE "vendors";
