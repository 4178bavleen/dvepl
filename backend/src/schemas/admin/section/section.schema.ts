import { z } from "zod";

export const createSectionSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  departmentId: z.string().uuid("Invalid department ID"),
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateSectionSchema = createSectionSchema.partial();
