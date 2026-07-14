import { z } from "zod";

export const createEmployeeEmergencyContactSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  name: z.string().min(1, "Name is required").trim(),
  relationship: z.string().min(1, "Relationship is required").trim(),
  phone: z.string().min(1, "Phone is required").trim(),
});

export const updateEmployeeEmergencyContactSchema = createEmployeeEmergencyContactSchema.partial();

export const employeeEmergencyContactIdParamSchema = z.object({
  id: z.string().uuid("Invalid contact id"),
});
