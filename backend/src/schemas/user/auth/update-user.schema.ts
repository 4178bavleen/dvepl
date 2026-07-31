import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});