import { z } from "zod";

export const createGovernmentDepartmentSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().optional().nullable(),
  shortName: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateGovernmentDepartmentSchema = createGovernmentDepartmentSchema.partial();
