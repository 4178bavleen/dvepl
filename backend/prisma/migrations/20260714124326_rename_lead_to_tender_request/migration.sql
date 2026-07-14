/*
  Warnings:

  - You are about to drop the `lead_activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leads` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TenderRequestSource" AS ENUM ('WEBSITE', 'REFERRAL', 'EMAIL', 'WHATSAPP', 'MANUAL');

-- CreateEnum
CREATE TYPE "TenderRequestStatus" AS ENUM ('NEW', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'TENDER', 'QUOTATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ReferenceCodeAction" AS ENUM ('GENERATED', 'UPDATED', 'DELETED', 'REGENERATED', 'MISSING');

-- DropForeignKey
ALTER TABLE "lead_activities" DROP CONSTRAINT "lead_activities_leadId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_companyId_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_createdById_fkey";

-- DropForeignKey
ALTER TABLE "leads" DROP CONSTRAINT "leads_customerId_fkey";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "firmName" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

-- DropTable
DROP TABLE "lead_activities";

-- DropTable
DROP TABLE "leads";

-- DropEnum
DROP TYPE "LeadSource";

-- DropEnum
DROP TYPE "LeadStatus";

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenderRequestId" TEXT,
    "customerId" TEXT,
    "departmentId" TEXT,
    "sectionId" TEXT,
    "divisionId" TEXT,
    "subDivisionId" TEXT,
    "tenderNo" TEXT,
    "tenderCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectLocation" TEXT,
    "estimatedCost" DECIMAL(15,2),
    "publishedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "TenderStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "governmentDepartmentId" TEXT,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_files" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_remarks" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "userId" TEXT,
    "remark" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_requests" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "source" "TenderRequestSource" NOT NULL DEFAULT 'WEBSITE',
    "status" "TenderRequestStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedValue" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tender_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_activities" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "shortName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "governmentDepartmentId" TEXT,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_divisions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "sub_divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_codes" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "oldReferenceCode" TEXT,
    "newReferenceCode" TEXT,
    "actionType" "ReferenceCodeAction" NOT NULL,
    "actionReason" TEXT,
    "actionBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_code_counters" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT 'REF',
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_code_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenders_tenderCode_key" ON "tenders"("tenderCode");

-- CreateIndex
CREATE INDEX "tenders_companyId_idx" ON "tenders"("companyId");

-- CreateIndex
CREATE INDEX "tenders_status_idx" ON "tenders"("status");

-- CreateIndex
CREATE INDEX "tenders_dueDate_idx" ON "tenders"("dueDate");

-- CreateIndex
CREATE INDEX "tender_requests_companyId_idx" ON "tender_requests"("companyId");

-- CreateIndex
CREATE INDEX "tender_requests_assignedToId_idx" ON "tender_requests"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "government_departments_companyId_name_key" ON "government_departments"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sections_departmentId_name_key" ON "sections"("departmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_sectionId_name_key" ON "divisions"("sectionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_divisions_divisionId_name_key" ON "sub_divisions"("divisionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "reference_code_counters_companyId_prefix_key" ON "reference_code_counters"("companyId", "prefix");

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_tenderRequestId_fkey" FOREIGN KEY ("tenderRequestId") REFERENCES "tender_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_subDivisionId_fkey" FOREIGN KEY ("subDivisionId") REFERENCES "sub_divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_governmentDepartmentId_fkey" FOREIGN KEY ("governmentDepartmentId") REFERENCES "government_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_files" ADD CONSTRAINT "tender_files_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_remarks" ADD CONSTRAINT "tender_remarks_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_remarks" ADD CONSTRAINT "tender_remarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_requests" ADD CONSTRAINT "tender_requests_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_requests" ADD CONSTRAINT "tender_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_requests" ADD CONSTRAINT "tender_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_requests" ADD CONSTRAINT "tender_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_activities" ADD CONSTRAINT "tender_activities_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_departments" ADD CONSTRAINT "government_departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_governmentDepartmentId_fkey" FOREIGN KEY ("governmentDepartmentId") REFERENCES "government_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_divisions" ADD CONSTRAINT "sub_divisions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_divisions" ADD CONSTRAINT "sub_divisions_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_codes" ADD CONSTRAINT "reference_codes_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_code_counters" ADD CONSTRAINT "reference_code_counters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
