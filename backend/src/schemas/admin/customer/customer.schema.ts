import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  gst: z.string().trim().optional().nullable(),
  pan: z.string().trim().optional().nullable(),
  billingAddress: z.string().trim().optional().nullable(),
  shippingAddress: z.string().trim().optional().nullable(),
  paymentTerms: z.string().trim().optional().nullable(),
  firmName: z.string().trim().optional().nullable(),
  isGovernment: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateCustomerSchema = createCustomerSchema.partial();
