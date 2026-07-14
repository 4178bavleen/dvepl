import { z } from "zod";
import { LeadSource, LeadStatus } from "@prisma/client";

export const createLeadSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  customerId: z.string().uuid("Invalid customer ID").optional().nullable(),
  assignedToId: z.string().uuid("Invalid assigned user ID").optional().nullable(),
  createdById: z.string().uuid("Invalid creator employee ID").optional().nullable(),
  source: z.nativeEnum(LeadSource),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  title: z.string().trim().min(1, "Lead title is required"),
  description: z.string().trim().optional().nullable(),
  estimatedValue: z.number().nonnegative().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();
