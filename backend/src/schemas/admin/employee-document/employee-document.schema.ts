import { z } from "zod";

export const createEmployeeDocumentSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  documentType: z.string().min(1, "Document type is required").trim(),
  fileUrl: z.string().min(1, "File URL is required").trim(),
  fileName: z.string().min(1, "File name is required").trim(),
});

export const updateEmployeeDocumentSchema = createEmployeeDocumentSchema.partial();

export const employeeDocumentIdParamSchema = z.object({
  id: z.string().uuid("Invalid document id"),
});
