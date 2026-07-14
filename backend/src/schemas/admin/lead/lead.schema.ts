import { z } from "zod";
import { TenderRequestSource, TenderStatus } from "@prisma/client";

export const createLeadSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  customerId: z.string().uuid("Invalid customer ID").optional().nullable(),
  assignedToId: z.string().uuid("Invalid assigned user ID").optional().nullable(),
  createdById: z.string().uuid("Invalid creator employee ID").optional().nullable(),
  source: z.nativeEnum(TenderRequestSource),
  status: z.nativeEnum(TenderStatus).default(TenderStatus.OPEN),
  title: z.string().trim().min(1, "Lead title is required"),
  description: z.string().trim().optional().nullable(),
  estimatedValue: z.number().nonnegative().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();
