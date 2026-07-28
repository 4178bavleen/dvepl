/*
  Warnings:

  - The values [BANK_TRANSFER,DD,CREDIT_CARD,DEBIT_CARD,IMPS] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assignedToId` on the `sales_orders` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationEventCode" AS ENUM ('NEW_ORDER', 'PAYMENT_DUE', 'PO_CREATED', 'DELIVERY_DELAYED');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('RAW', 'SEMI_FINISHED', 'FINISHED', 'CONSUMABLE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationProvider" AS ENUM ('SMTP', 'META', 'TWILIO', 'WATI');

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
ALTER TABLE "payments" DROP CONSTRAINT "payments_invoiceId_fkey";

-- DropIndex
DROP INDEX "SalesOrderAssignment_salesOrderId_employeeId_key";

-- AlterTable
ALTER TABLE "SalesOrderAssignment" ALTER COLUMN "employeeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "salesOrderId" TEXT,
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sales_orders" DROP COLUMN "assignedToId",
ADD COLUMN     "assignedToIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

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

-- CreateTable
CREATE TABLE "NotificationConfiguration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUsername" TEXT,
    "smtpPassword" TEXT,
    "smtpFromEmail" TEXT,
    "smtpFromName" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappProvider" "NotificationProvider",
    "whatsappApiKey" TEXT,
    "whatsappEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "code" "NotificationEventCode" NOT NULL,
    "name" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "employeeId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "eventId" TEXT,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "error" TEXT,
    "relatedModule" TEXT,
    "relatedRecordId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "NotificationConfiguration_companyId_key" ON "NotificationConfiguration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEvent_code_key" ON "NotificationEvent"("code");

-- CreateIndex
CREATE INDEX "payments_salesOrderId_idx" ON "payments"("salesOrderId");

-- AddForeignKey
ALTER TABLE "SalesOrderAssignment" ADD CONSTRAINT "SalesOrderAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_preferredVendorId_fkey" FOREIGN KEY ("preferredVendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_options" ADD CONSTRAINT "custom_field_options_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationConfiguration" ADD CONSTRAINT "NotificationConfiguration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NotificationEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
