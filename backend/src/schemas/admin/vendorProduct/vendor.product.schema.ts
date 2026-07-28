import { z } from "zod";

export const vendorProductBulkCreateSchema = z.object({
  vendorId: z.string().uuid(),
  materialIds: z.array(z.string().uuid()).min(1, "Select at least one product"),
});

export const vendorProductReadQuerySchema = z.object({
  vendorId: z.string().uuid().optional(),
  materialId: z.string().uuid().optional(),
});
