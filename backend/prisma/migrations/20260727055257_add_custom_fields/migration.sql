/*
  Warnings:

  - The values [BANK_TRANSFER,DD,CREDIT_CARD,DEBIT_CARD,IMPS] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `leadDays` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `reorderLevel` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `reorderQty` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToId` on the `sales_orders` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'NEFT', 'RTGS', 'CHEQUE', 'UPI', 'OTHER');
ALTER TABLE "public"."payments" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH';
COMMIT;

-- DropForeignKey
ALTER TABLE "SalesOrderAssignment" DROP CONSTRAINT "SalesOrderAssignment_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_preferredVendorId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_invoiceId_fkey";

-- DropIndex
DROP INDEX "SalesOrderAssignment_salesOrderId_employeeId_key";

-- DropIndex
DROP INDEX "materials_category_idx";

-- DropIndex
DROP INDEX "materials_preferredVendorId_idx";

-- AlterTable
ALTER TABLE "SalesOrderAssignment" ALTER COLUMN "employeeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "category",
DROP COLUMN "leadDays",
DROP COLUMN "reorderLevel",
DROP COLUMN "reorderQty",
DROP COLUMN "type",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "salesOrderId" TEXT,
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "assignedToId",
ADD COLUMN     "assignedToIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "MaterialType";

-- CreateTable
CREATE TABLE "custom_fields" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "placeholder" TEXT,
    "helpText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "showInForm" BOOLEAN NOT NULL DEFAULT true,
    "showInTable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "afterField" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_options" (
    "id" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "stringValue" TEXT,
    "textValue" TEXT,
    "numberValue" DECIMAL(18,4),
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "jsonValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_fields_module_isActive_displayOrder_idx" ON "custom_fields"("module", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "custom_fields_module_key_key" ON "custom_fields"("module", "key");

-- CreateIndex
CREATE INDEX "custom_field_options_customFieldId_displayOrder_idx" ON "custom_field_options"("customFieldId", "displayOrder");

-- CreateIndex
CREATE INDEX "custom_field_values_entityId_idx" ON "custom_field_values"("entityId");

-- CreateIndex
CREATE INDEX "custom_field_values_customFieldId_idx" ON "custom_field_values"("customFieldId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_customFieldId_entityId_key" ON "custom_field_values"("customFieldId", "entityId");

-- CreateIndex
CREATE INDEX "materials_categoryId_idx" ON "materials"("categoryId");

-- CreateIndex
CREATE INDEX "payments_salesOrderId_idx" ON "payments"("salesOrderId");

-- AddForeignKey
ALTER TABLE "SalesOrderAssignment" ADD CONSTRAINT "SalesOrderAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "material_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_options" ADD CONSTRAINT "custom_field_options_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
