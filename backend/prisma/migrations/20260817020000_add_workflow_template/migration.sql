-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "position" INTEGER NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workflow_steps_templateId_key_key" ON "workflow_steps"("templateId", "key");

-- CreateIndex
CREATE INDEX "workflow_steps_templateId_idx" ON "workflow_steps"("templateId");

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the single global workflow template with the current stages
INSERT INTO "workflow_templates" ("id", "name", "description", "isActive", "isSystem", "createdAt", "updatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Order Workflow',
    'Standard order workflow from confirmation to production follow-up.',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "workflow_steps" ("id", "templateId", "key", "name", "color", "position", "isFinal", "isActive", "createdAt", "updatedAt") VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'ORDER_CONFIRMED', 'Order Confirmed', '#3b82f6', 0, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'PO_READY', 'PO Ready', '#8b5cf6', 1, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'DRAWING_ASSIGNED', 'Drawing Assigned', '#a855f7', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', 'DRAWING_SENT', 'Drawing Sent', '#6366f1', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'REVISION_REQUIRED', 'Revision Required', '#f97316', 4, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001', 'DRAWING_APPROVED', 'Drawing Approved', '#22c55e', 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001', 'PO_PLACED', 'PO Placed', '#10b981', 6, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001', 'INVENTORY_FOLLOW_UP', 'Inventory Follow-up', '#f59e0b', 7, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001', 'PRODUCTION_FOLLOW_UP', 'Production Follow-up', '#06b6d4', 8, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: convert enum columns to TEXT (values are preserved as-is)
ALTER TABLE "sales_orders" ALTER COLUMN "workflowStage" DROP DEFAULT;
ALTER TABLE "sales_orders" ALTER COLUMN "workflowStage" TYPE TEXT USING "workflowStage"::text;
ALTER TABLE "sales_orders" ALTER COLUMN "workflowStage" SET DEFAULT 'ORDER_CONFIRMED';

ALTER TABLE "WorkflowEvent" ALTER COLUMN "stage" TYPE TEXT USING "stage"::text;

-- DropEnum
DROP TYPE IF EXISTS "WorkflowStage";
