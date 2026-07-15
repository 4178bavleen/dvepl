import { z } from "zod";

export const createTenderRequestActivitySchema = z.object({
  tenderRequestId: z.string().uuid("Invalid tender request ID"),
  activityType: z.string().trim().min(1, "Activity type is required"),
  remarks: z.string().trim().optional().nullable(),
});

export const tenderRequestActivityListQuerySchema = z.object({
  tenderRequestId: z.string().uuid("Invalid tender request ID"),
});
