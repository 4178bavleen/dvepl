import { z } from "zod";

export const createEmployeeExperienceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  companyName: z.string().min(1, "Company name is required").trim(),
  designation: z.string().min(1, "Designation is required").trim(),
  fromDate: z.coerce.date().optional().nullable(),
  toDate: z.coerce.date().optional().nullable(),
}).refine(data => {
  if (data.fromDate && data.toDate) {
    return data.toDate >= data.fromDate;
  }
  return true;
}, {
  message: "End date (toDate) must be after start date (fromDate)",
  path: ["toDate"],
});

export const updateEmployeeExperienceSchema = z.object({
  employeeId: z.string().uuid().optional(),
  companyName: z.string().min(1).trim().optional(),
  designation: z.string().min(1).trim().optional(),
  fromDate: z.coerce.date().optional().nullable(),
  toDate: z.coerce.date().optional().nullable(),
}).refine(data => {
  if (data.fromDate && data.toDate) {
    return data.toDate >= data.fromDate;
  }
  return true;
}, {
  message: "End date (toDate) must be after start date (fromDate)",
  path: ["toDate"],
});

export const employeeExperienceIdParamSchema = z.object({
  id: z.string().uuid("Invalid experience id"),
});
