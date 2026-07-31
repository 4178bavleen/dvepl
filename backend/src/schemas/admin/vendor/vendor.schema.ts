import { z } from "zod";


export const vendorSchema = z.object({

  companyId:
    z.string().uuid(),


  name:
    z.string()
      .min(2, "Vendor name is required"),

  phone: z
    .preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.string().max(10, "Phone number cannot exceed 10 digits").optional()
    ),

  email: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().email("Invalid email address").optional()
  ),

  gstNumber: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional()
  ),

  address: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional()
  ),

  notes: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional()
  ),

  contactPerson: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional()
  ),

  category: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.string().optional()
  ),



});

export const updateVendorSchema = vendorSchema.partial();