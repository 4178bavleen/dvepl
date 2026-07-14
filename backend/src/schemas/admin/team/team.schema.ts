import { z } from "zod";

export const createTeamSchema = z.object({
  departmentId: z.string().uuid("Invalid department ID"),
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(100),
  isActive: z.boolean().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();