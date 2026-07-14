import { z } from "zod";
import { ContactType } from "@prisma/client";

export const createEmployeeContactSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  type: z.nativeEnum(ContactType, {
    message: "Invalid contact type (must be PHONE, EMAIL, or ADDRESS)",
  }),
  value: z.string().min(1, "Value is required").trim(),
  isPrimary: z.boolean().optional().default(false),
});

export const updateEmployeeContactSchema = createEmployeeContactSchema.partial();

export const employeeContactIdParamSchema = z.object({
  id: z.string().uuid("Invalid contact id"),
});
