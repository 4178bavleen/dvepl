import { z } from "zod";

export const purchaseOrderSchema = z.object({
  poNo: z.string().min(1),

  vendorId: z.string().uuid(),

  orderDate: z.string().datetime(),

  expectedDelivery: z.string().datetime().optional().nullable(),

  paymentTerms: z.string().optional(),

  shippingTerms: z.string().optional(),

  remarks: z.string().optional(),

  items: z.array(
    z.object({
      materialId: z.string().uuid(),

      quantity: z.coerce.number().positive(),

      unitPrice: z.coerce.number().positive(),
    }),
  ),
});   