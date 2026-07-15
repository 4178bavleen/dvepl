import { z } from "zod";
import { TenderRequestSource, TenderRequestStatus } from "@prisma/client";

export const createTenderRequestSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  customerId: z.string().uuid("Invalid customer ID").optional().nullable(),
  assignedToId: z.string().uuid("Invalid assigned user ID").optional().nullable(),
  createdById: z.string().uuid("Invalid creator employee ID").optional().nullable(),
  source: z.enum(TenderRequestSource),
  status: z.enum(TenderRequestStatus).default(TenderRequestStatus.NEW),
  title: z.string().trim().min(1, "Tender request title is required"),
  description: z.string().trim().optional().nullable(),
  estimatedValue: z.number().nonnegative().optional().nullable(),
});

export const updateTenderRequestSchema = createTenderRequestSchema.partial();
