import { z } from "zod";

export const regenerateReferenceCodeSchema = z.object({
  prefix: z.string()
    .trim()
    .min(1)
    .max(10)
    .toUpperCase()
    .optional(),
  reason: z.string()
    .trim()
    .min(3, "Reason must be at least 3 characters long"),
});

export const referenceCodeListQuerySchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID").optional(),
});
