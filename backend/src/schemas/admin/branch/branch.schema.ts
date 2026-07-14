import { z } from "zod";

export const createBranchSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(1),

  address: z.string().optional(),

  city: z.string().optional(),

  state: z.string().optional(),

  pincode: z.string().optional(),

  isActive: z.boolean().optional(),
});
export const updateBranchSchema = createBranchSchema.partial();