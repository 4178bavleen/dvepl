import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),

  gst: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  pan: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  gst: z.string().optional(),
  pan: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});