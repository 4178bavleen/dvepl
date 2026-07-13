import { z } from "zod";

export const createSubDivisionSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  divisionId: z.string().uuid("Invalid division ID"),
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateSubDivisionSchema = createSubDivisionSchema.partial();
