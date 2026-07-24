import { z } from "zod";
import { EmployeeStatus } from "@prisma/client";

export const createEmployeeSchema = z.object({
    

    branchId: z.string().uuid().optional().nullable(),

    departmentId: z.string().uuid().optional().nullable(),

    teamId: z.string().uuid().optional().nullable(),

    designationId: z.string().uuid().optional().nullable(),

    reportsToId: z.string().uuid().optional().nullable(),

    employeeCode: z
        .string()
        .trim()
        .min(1, "Employee code is required"),

    firstName: z
        .string()
        .trim()
        .min(2, "First name is required"),

    lastName: z
        .string()
        .trim()
        .min(2, "Last name is required"),

    gender: z.string().optional().nullable(),

    dateOfBirth: z.coerce.date().optional().nullable(),

    dateOfJoining: z.coerce.date().optional().nullable(),

    dateOfExit: z.coerce.date().optional().nullable(),

    email: z
        .string()
        .email("Invalid email address")
        .optional()
        .nullable()
        .or(z.literal("")),

    status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),

    userId: z.string().uuid().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeIdParamSchema = z.object({
    id: z.string().uuid("Invalid employee id"),
});