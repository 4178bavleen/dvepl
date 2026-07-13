import { z } from "zod";

export const createTenderFileSchema = z.object({
  tenderId: z.string().uuid("Invalid tender ID"),
  fileName: z.string().trim().min(1, "File name is required"),
  fileUrl: z.string().trim().min(1, "File URL is required"),
  fileType: z.string().trim().optional().nullable(),
  uploadedBy: z.string().trim().optional().nullable(),
});
