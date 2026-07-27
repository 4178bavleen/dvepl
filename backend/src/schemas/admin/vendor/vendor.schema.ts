import { z } from "zod";


export const vendorSchema = z.object({

  companyId:
    z.string().uuid(),


  name:
    z.string()
    .min(2,"Vendor name is required"),


  category:
    z.string()
    .optional(),


  contactPerson:
    z.string()
    .optional(),


  phone:
    z.string()
    .max(10, "Phone number cannot exceed 10 digits")
    .optional(),


  email:
    z.string()
    .email()
    .optional(),


  gstNumber:
    z.string()
    .optional(),


  address:
    z.string()
    .optional(),


  notes:
    z.string()
    .optional(),


});