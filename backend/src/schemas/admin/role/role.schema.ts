import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name is required")
    .max(100),

  description: z
    .string()
    .trim()
    .optional(),

  permissionIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one permission"),
});


export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid()).min(1),
});