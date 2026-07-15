import { z } from "zod";

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),

  gst: z
    .string()
    .trim()
    .toUpperCase()
    .regex(gstRegex, "Invalid Gst Number - should contain min 15 letters")
    .optional()
    .or(z.literal("")),

  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(panRegex, "Invalid Pan Number - should contain min 10 letters")
    .optional()
    .or(z.literal("")),

  email: z.string().email("Invalid email").optional().or(z.literal("")),

  phone: z.string().trim().optional().or(z.literal("")),

  address: z.string().trim().optional().or(z.literal("")),
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
