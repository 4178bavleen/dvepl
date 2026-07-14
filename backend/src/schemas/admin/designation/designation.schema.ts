import { z } from "zod";

export const createDesignationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Designation title must be at least 2 characters.")
    .max(100, "Designation title cannot exceed 100 characters."),

  level: z
    .number()
    .int("Level must be an integer.")
    .nonnegative("Level must be a non-negative number.")
    .optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial();
