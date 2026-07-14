import { z } from "zod";

export const createTenderActivitySchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID"),
  action: z.string().trim().min(1, "Action is required"),
  oldValue: z.any().optional().nullable(),
  newValue: z.any().optional().nullable(),
  performedBy: z.string().trim().optional().nullable(),
});

export const tenderActivityListQuerySchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID"),
});
