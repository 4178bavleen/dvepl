/*
  Warnings:

  - The values [CUSTOMER_USER] on the enum `RoleType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `image` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `RolePermission` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `RolePermission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RolePermission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resource,action]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roleType]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Made the column `roleId` on table `Admin` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `action` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resource` to the `Permission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Resource" AS ENUM ('USER', 'CUSTOMER', 'DIRECT_SELLER', 'PREFERRED_CUSTOMER', 'ADMIN', 'ROLE', 'PERMISSION', 'ROLE_PERMISSION', 'TICKET', 'SUPPORT', 'CONTACT', 'LEAD', 'LEAD_FOLLOW_UP', 'DEAL', 'REPORT', 'DASHBOARD', 'LOG', 'ANALYTICS', 'CMS_PAGE', 'CMS_SECTION', 'MENU', 'MEDIA', 'SETTING', 'SUBSCRIPTION', 'QUEUE', 'THEME', 'RECYCLE_BIN', 'INTEGRATION', 'WEBSITE_SETTING', 'APP_CONFIG');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'PUBLISH', 'RESTORE', 'IMPERSONATE');

-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('ALL', 'OWN', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- AlterEnum
BEGIN;
CREATE TYPE "RoleType_new" AS ENUM ('SYSTEM_ADMIN', 'INTERNAL_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'PRODUCT_MANAGER', 'SUPPORT_EXECUTIVE', 'VIEWER');
ALTER TABLE "public"."Role" ALTER COLUMN "roleType" DROP DEFAULT;
ALTER TABLE "Role" ALTER COLUMN "roleType" TYPE "RoleType_new" USING ("roleType"::text::"RoleType_new");
ALTER TYPE "RoleType" RENAME TO "RoleType_old";
ALTER TYPE "RoleType_new" RENAME TO "RoleType";
DROP TYPE "public"."RoleType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_roleId_fkey";

-- AlterTable
ALTER TABLE "Admin" DROP COLUMN "image",
ADD COLUMN     "imageId" INTEGER,
ALTER COLUMN "roleId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "isActive",
DROP COLUMN "isDeleted",
DROP COLUMN "updatedAt",
ADD COLUMN     "action" "Action" NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "resource" "Resource" NOT NULL;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "roleType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RolePermission" DROP COLUMN "createdAt",
DROP COLUMN "isDeleted",
DROP COLUMN "updatedAt",
ADD COLUMN     "effect" "PermissionEffect" NOT NULL DEFAULT 'ALLOW',
ADD COLUMN     "scope" "PermissionScope" NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE "AdminPermission" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermission_adminId_permissionId_key" ON "AdminPermission"("adminId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_resource_action_key" ON "Permission"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleType_key" ON "Role"("roleType");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
