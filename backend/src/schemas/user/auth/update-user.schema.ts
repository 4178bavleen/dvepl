import { z } from "zod";

export const updateUserSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  roleIds: z.array(z.string().uuid()).min(1),
});