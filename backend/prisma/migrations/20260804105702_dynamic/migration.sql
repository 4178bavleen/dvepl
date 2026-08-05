-- CreateEnum
CREATE TYPE "DynamicFieldType" AS ENUM ('TEXT', 'NUMBER', 'TEXTAREA', 'SELECT', 'DATE');

-- CreateTable
CREATE TABLE "DynamicModule" (
    "id" TEXT NOT NULL,
    "moduleKey" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicField" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "DynamicFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "orderNo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DynamicField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicRecord" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicModule_moduleKey_key" ON "DynamicModule"("moduleKey");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicField_moduleId_fieldName_key" ON "DynamicField"("moduleId", "fieldName");

-- AddForeignKey
ALTER TABLE "DynamicField" ADD CONSTRAINT "DynamicField_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DynamicModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicRecord" ADD CONSTRAINT "DynamicRecord_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "DynamicModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
