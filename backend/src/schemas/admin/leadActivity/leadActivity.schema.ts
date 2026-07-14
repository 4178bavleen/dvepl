import { z } from "zod";

export const createLeadActivitySchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  activityType: z.string().trim().min(1, "Activity type is required"),
  remarks: z.string().trim().optional().nullable(),
});

export const leadActivityListQuerySchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
});
