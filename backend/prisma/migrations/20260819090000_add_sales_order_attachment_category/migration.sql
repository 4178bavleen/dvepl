-- Add category column to sales_order_attachments for project document uploads
ALTER TABLE "sales_order_attachments" ADD COLUMN "category" TEXT;
