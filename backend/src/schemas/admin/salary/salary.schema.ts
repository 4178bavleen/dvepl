import { z } from "zod";

export const createSalarySchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  effectiveFrom: z.coerce.date(),
  basic: z.number().nonnegative("Basic salary must be non-negative"),
  hra: z.number().nonnegative("HRA must be non-negative").optional().default(0),
  allowances: z.number().nonnegative("Allowances must be non-negative").optional().default(0),
  deductions: z.number().nonnegative("Deductions must be non-negative").optional().default(0),
  ctc: z.number().nonnegative("CTC must be non-negative"),
});

export const updateSalarySchema = z.object({
  employeeId: z.string().uuid().optional(),
  effectiveFrom: z.coerce.date().optional(),
  basic: z.number().nonnegative().optional(),
  hra: z.number().nonnegative().optional(),
  allowances: z.number().nonnegative().optional(),
  deductions: z.number().nonnegative().optional(),
  ctc: z.number().nonnegative().optional(),
});

export const salaryIdParamSchema = z.object({
  id: z.string().uuid("Invalid salary id"),
});
