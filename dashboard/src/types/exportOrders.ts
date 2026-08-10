import { z } from "zod";

const stringValue = z.string().nullish().transform((value) => value ?? "");
const numberValue = z.coerce.number().catch(0);

export const exportOrderSchema = z.object({
  id: z.string(),
  dveplCode: stringValue,
  partyName: stringValue,
  status: stringValue,
  grandTotal: numberValue,
  deliveryMonthTarget: stringValue,
  orderConfirmDate: stringValue,
  items: z.array(z.object({ quantity: numberValue }).passthrough()).catch([]),
}).passthrough();

export const engineeringDrawingSchema = z.object({
  id: z.string(),
  drawingNo: stringValue,
  title: stringValue,
  drawingType: stringValue,
  fileUrl: stringValue,
  fileName: stringValue,
  fileSize: z.coerce.number().nullable().catch(null),
  mimeType: z.string().nullable().catch(null),
  status: stringValue,
  project: z.object({
    id: z.string(),
    name: stringValue,
    salesOrderId: z.string(),
  }).nullable().optional(),
}).passthrough();

export const exportOrdersResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(exportOrderSchema),
  message: z.string().optional(),
});

export const drawingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(engineeringDrawingSchema),
  message: z.string().optional(),
});

export const drawingResponseSchema = z.object({
  success: z.literal(true),
  data: engineeringDrawingSchema,
  message: z.string().optional(),
});

export const nextDrawingNumberResponseSchema = z.object({
  success: z.literal(true),
  data: z.string().min(1),
  message: z.string().optional(),
});

export const uploadedFileResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    fileName: z.string(),
    fileUrl: z.string().min(1),
    mimeType: z.string().optional(),
  }),
  message: z.string().optional(),
});

export type ExportOrder = z.infer<typeof exportOrderSchema>;
export type EngineeringDrawing = z.infer<typeof engineeringDrawingSchema>;

export interface ExportOrderFilters {
  search?: string;
  status?: string;
  assignedEngineer?: string;
  startDate?: string;
  endDate?: string;
}
