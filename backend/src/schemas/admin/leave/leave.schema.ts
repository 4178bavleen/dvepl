import { z } from "zod";

export const createLeaveSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  leaveType: z.string().min(1, "Leave type is required").trim(),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  reason: z.string().optional().nullable().transform(val => val === "" ? null : val),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  approvedById: z.string().uuid("Invalid approved by id").optional().nullable(),
}).refine(data => {
  if (data.fromDate && data.toDate) {
    return data.toDate >= data.fromDate;
  }
  return true;
}, {
  message: "End date (toDate) must be after or equal to start date (fromDate)",
  path: ["toDate"],
});

export const updateLeaveSchema = z.object({
  employeeId: z.string().uuid().optional(),
  leaveType: z.string().min(1).trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  reason: z.string().optional().nullable().transform(val => val === "" ? null : val),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  approvedById: z.string().uuid().optional().nullable(),
}).refine(data => {
  if (data.fromDate && data.toDate) {
    return data.toDate >= data.fromDate;
  }
  return true;
}, {
  message: "End date (toDate) must be after or equal to start date (fromDate)",
  path: ["toDate"],
});

export const leaveIdParamSchema = z.object({
  id: z.string().uuid("Invalid leave id"),
});
