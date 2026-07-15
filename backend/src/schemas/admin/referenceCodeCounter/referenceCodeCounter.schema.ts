import { z } from "zod";

export const createReferenceCodeCounterSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  prefix: z.string()
    .trim()
    .min(1, "Prefix must be at least 1 character")
    .max(10, "Prefix cannot exceed 10 characters")
    .toUpperCase(),
  lastSequence: z.number().int().nonnegative().optional().default(0),
});

export const updateReferenceCodeCounterSchema = z.object({
  prefix: z.string()
    .trim()
    .min(1, "Prefix must be at least 1 character")
    .max(10, "Prefix cannot exceed 10 characters")
    .toUpperCase()
    .optional(),
  lastSequence: z.number().int().nonnegative().optional(),
});
