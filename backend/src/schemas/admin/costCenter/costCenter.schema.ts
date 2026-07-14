import { z } from "zod";

export const createCostCenterSchema = z.object({
  departmentId: z.string().uuid("Invalid department ID").optional(),
  code: z
    .string()
    .trim()
    .min(2, "Cost center code must be at least 2 characters.")
    .max(50, "Cost center code cannot exceed 50 characters."),
  name: z
    .string()
    .trim()
    .min(2, "Cost center name must be at least 2 characters.")
    .max(100, "Cost center name cannot exceed 100 characters."),
  budget: z.number().nonnegative("Budget must be non-negative").optional(),
});

export const updateCostCenterSchema = createCostCenterSchema.partial();
