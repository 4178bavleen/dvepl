import { z } from "zod";

export const createContactPersonSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  name: z.string().trim().min(1, "Contact person name is required"),
  designation: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Invalid email format").optional().nullable().or(z.literal("")),
  isPrimary: z.boolean().default(false),
});

export const updateContactPersonSchema = createContactPersonSchema.partial().omit({ customerId: true });

export const contactPersonListQuerySchema = z.object({
  customerId: z.string().uuid("Invalid customer ID").optional(),
});
