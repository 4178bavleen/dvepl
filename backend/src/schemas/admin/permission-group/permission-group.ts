import { z } from "zod";

export const createPermissionGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Permission group name must be at least 2 characters.")
    .max(100, "Permission group name cannot exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(255, "Description cannot exceed 255 characters.")
    .optional(),
});

export const updatePermissionGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Permission group name must be at least 2 characters.")
    .max(100, "Permission group name cannot exceed 100 characters.")
    .optional(),

  description: z
    .string()
    .trim()
    .max(255, "Description cannot exceed 255 characters.")
    .optional(),
});

export type CreatePermissionGroupInput = z.infer<
  typeof createPermissionGroupSchema
>;

export type UpdatePermissionGroupInput = z.infer<
  typeof updatePermissionGroupSchema
>;