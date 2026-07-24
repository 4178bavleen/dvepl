import { z } from "zod";
import { MaterialType } from "@prisma/client";
export const inventorySchema = z.object({
  materialCode: z.string().min(1),

  name: z.string().min(1),

  category: z.string().min(1),

  type: z.nativeEnum(MaterialType),

  notes: z.string().optional().nullable(),

  hsnCode: z.string().optional().nullable(),

  gst: z.coerce.number(),

  unit: z.string(),

  weight: z.coerce.number().optional().nullable(),

  color: z.string().optional().nullable(),

  openingStock: z.coerce.number(),

  reorderLevel: z.coerce.number().optional(),

  reorderQty: z.coerce.number().optional(),

  vendorLeadDays: z.coerce.number().optional(),

  vendorName: z.string().optional(),

  vendorContact: z.string().optional(),

  warehouseId: z.string().uuid().optional().nullable(),

  binId: z.string().uuid().optional().nullable(),

  unitRate: z.coerce.number(),

  batchNo: z.string().optional().nullable(),

  serialNo: z.string().optional().nullable(),

  barcode: z.string().optional().nullable(),

  qrCode: z.string().optional().nullable(),

  expiryDate: z.string().datetime().optional().nullable(),

  location: z.string().optional().nullable(),
});
export const inventoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),

  notes: z.string().optional().nullable(),

  category: z.string().trim().optional(),

  type: z.nativeEnum(MaterialType).optional(),

  hsnCode: z.string().trim().optional().nullable(),

  gst: z.coerce.number().min(0).max(100).optional(),

  unit: z.string().trim().min(1).optional(),

  weight: z.coerce.number().optional().nullable(),

  color: z.string().trim().optional().nullable(),

  reorderLevel: z.coerce.number().min(0).optional(),

  reorderQty: z.coerce.number().min(0).optional(),

  vendorLeadDays: z.coerce.number().int().min(0).optional(),

  warehouseId: z.string().uuid().optional().nullable(),

  binId: z.string().uuid().optional().nullable(),

  unitRate: z.coerce.number().min(0).optional(),

  batchNo: z.string().trim().optional().nullable(),

  serialNo: z.string().trim().optional().nullable(),

  barcode: z.string().trim().optional().nullable(),

  qrCode: z.string().trim().optional().nullable(),

  expiryDate: z.string().datetime().optional().nullable(),
});

export const inventoryStockInSchema = z.object({
  inventoryId: z.string().uuid(),

  quantity: z.coerce.number().positive(),

  referenceType: z.string().min(1),

  referenceId: z.string().min(1),

  remarks: z.string().optional().nullable(),
});
export const inventoryStockOutSchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  remarks: z.string().optional(),
});

export const inventoryStockAdjustmentSchema = z.object({
  inventoryId: z.string().uuid(),
  actualQuantity: z.coerce.number().min(0),
  remarks: z.string().optional(),
});
export const inventoryStockReturnSchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  remarks: z.string().optional(),
});
