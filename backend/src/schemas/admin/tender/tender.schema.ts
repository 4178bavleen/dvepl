import { z } from "zod";
import { TenderStatus } from "@prisma/client";

export const createTenderSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  tenderRequestId: z.string().uuid("Invalid tender request ID").optional().nullable(),
  customerId: z.string().uuid("Invalid customer ID").optional().nullable(),
  departmentId: z.string().uuid("Invalid department ID").optional().nullable(),
  sectionId: z.string().uuid("Invalid section ID").optional().nullable(),
  divisionId: z.string().uuid("Invalid division ID").optional().nullable(),
  subDivisionId: z.string().uuid("Invalid subdivision ID").optional().nullable(),
  governmentDepartmentId: z.string().uuid("Invalid government department ID").optional().nullable(),
  tenderNo: z.string().trim().optional().nullable(),
  tenderCode: z.string().trim().optional().nullable(),
  title: z.string().trim().min(1, "Tender title is required"),
  description: z.string().trim().optional().nullable(),
  projectLocation: z.string().trim().optional().nullable(),
  estimatedCost: z.number().nonnegative().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  status: z.nativeEnum(TenderStatus).default(TenderStatus.DRAFT),
  createdById: z.string().uuid("Invalid creator ID"),
  assignedToId: z.string().uuid("Invalid assignee ID").optional().nullable(),
});

export const updateTenderSchema = createTenderSchema.partial();
