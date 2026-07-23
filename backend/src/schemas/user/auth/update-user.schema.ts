import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  roleIds: z.array(z.string().uuid()).optional(),
});