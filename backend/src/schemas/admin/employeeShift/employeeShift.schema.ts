import { z } from "zod";

export const createEmployeeShiftSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  shiftId: z.string().uuid("Invalid shift id"),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional().nullable(),
}).refine(data => {
  if (data.effectiveFrom && data.effectiveTo) {
    return data.effectiveTo >= data.effectiveFrom;
  }
  return true;
}, {
  message: "Effective to date (effectiveTo) must be after or equal to effective from date (effectiveFrom)",
  path: ["effectiveTo"],
});

export const updateEmployeeShiftSchema = z.object({
  employeeId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional().nullable(),
}).refine(data => {
  if (data.effectiveFrom && data.effectiveTo) {
    return data.effectiveTo >= data.effectiveFrom;
  }
  return true;
}, {
  message: "Effective to date (effectiveTo) must be after or equal to effective from date (effectiveFrom)",
  path: ["effectiveTo"],
});

export const employeeShiftIdParamSchema = z.object({
  id: z.string().uuid("Invalid assignment id"),
});
