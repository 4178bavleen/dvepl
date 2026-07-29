-- Add soft-delete support for records that were previously hard-deleted.
ALTER TABLE "permission_groups" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "employee_contacts" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "employee_emergency_contacts" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "employee_education" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "employee_experience" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "employee_documents" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "employee_shifts" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "holidays" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "attendance" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "leaves" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "salaries" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "communication_history" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "tender_files" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "tender_activities" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "government_departments" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "audit_logs" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "reference_code_counters" ADD COLUMN "deletedAt" TIMESTAMP(3);
