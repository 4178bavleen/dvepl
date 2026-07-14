import { z } from "zod";

export const createTenderRemarkSchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID"),
  userId: z.string().uuid("Invalid user ID").optional().nullable(),
  remark: z.string().trim().min(1, "Remark is required"),
});
