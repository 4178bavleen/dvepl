import { z } from "zod";

export const createEmployeeEducationSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  degree: z.string().min(1, "Degree is required").trim(),
  institution: z.string().min(1, "Institution is required").trim(),
  yearOfPassing: z.number().int().min(1900).max(2100).optional().nullable(),
  grade: z.string().optional().nullable().transform(val => val === "" ? null : val),
});

export const updateEmployeeEducationSchema = createEmployeeEducationSchema.partial();

export const employeeEducationIdParamSchema = z.object({
  id: z.string().uuid("Invalid education id"),
});
