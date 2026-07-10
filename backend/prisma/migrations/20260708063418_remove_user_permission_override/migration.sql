/*
  Warnings:

  - You are about to drop the `user_permission_overrides` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "user_permission_overrides_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "user_permission_overrides_userId_fkey";

-- DropTable
DROP TABLE "user_permission_overrides";
