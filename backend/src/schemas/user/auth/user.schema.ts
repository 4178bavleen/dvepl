import { z } from "zod";

export const createUserSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
    name: z 
    .string()
    .optional(),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional(),

  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password cannot exceed 32 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[@$!%*?&#^()_\-+=]/,
      "Password must contain at least one special character"
    ),

  roleIds: z
    .array(z.string().uuid("Invalid Role ID"))
    .min(1, "At least one role must be assigned"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;