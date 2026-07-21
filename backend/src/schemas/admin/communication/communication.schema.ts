import { z } from "zod";
import { CommunicationType } from "@prisma/client";

export const createCommunicationHistorySchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  type: z.nativeEnum(CommunicationType),
  subject: z.string().trim().optional().nullable(),
  content: z.string().trim().optional().nullable(),
});

export const communicationListQuerySchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional(),
});
