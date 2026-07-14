import { z } from "zod";

export const createDivisionSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  name: z.string().trim().min(1, "Name is required"),
  code: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateDivisionSchema = createDivisionSchema.partial();
