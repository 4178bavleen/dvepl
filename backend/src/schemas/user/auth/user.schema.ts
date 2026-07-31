import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  name: z 
    .string()
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine((val) => !val || /^\+?[\d\s-]{10,15}$/.test(val), {
      message: "Invalid phone number",
    }),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .optional(),
  roleIds: z
    .array(z.string().uuid("Invalid Role ID"))
    .optional()
    .default([]),
  role: z
    .string()
    .optional(),
  designation: z
    .string()
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;