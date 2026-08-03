import { z } from "zod";

export const goodsReceiptSchema = z.object({
  poId: z.string().uuid(),

  grnNo: z.string().min(1),

  invoiceNo: z.string().optional().nullable(),

  invoiceDate: z.string().optional().nullable(),

  remarks: z.string().optional().nullable(),

  items: z.array(
    z.object({
      poItemId: z.string().uuid(),

      materialId: z.string().uuid(),

      quantity: z.coerce.number().positive(),

      acceptedQty: z.coerce.number().positive(),

      rejectedQty: z.coerce.number().default(0),

      unitPrice: z.coerce.number(),

      batchNo: z.string().optional().nullable(),

      serialNo: z.string().optional().nullable(),

      expiryDate: z.string().optional().nullable(),

      remarks: z.string().optional().nullable(),
    })
  ),
});