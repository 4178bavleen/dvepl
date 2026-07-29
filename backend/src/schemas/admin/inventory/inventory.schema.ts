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

  preferredVendorId: z.string().uuid().optional().nullable(), // 👈 ADD THIS

  // warehouseId: z.string().uuid().optional().nullable(),

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
name: z.string().optional(),
type: z.nativeEnum(MaterialType).optional(),
category: z.string().optional(),
unit: z.string().optional(),
hsnCode: z.string().optional(),

gstPercent: z.coerce.number().optional(),
gst: z.coerce.number().optional(),

reorderLevel: z.coerce.number().optional(),
reorderQty: z.coerce.number().optional(),

preferredVendorId: z.string().uuid().optional().nullable(),

notes: z.string().optional().nullable(),
description: z.string().optional().nullable(),

currentStock: z.coerce.number().optional(),
quantity: z.coerce.number().optional(),

unitRate: z.coerce.number().optional(),
unitPrice: z.coerce.number().optional(),

location: z.string().optional(),
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
  referenceType: z.string().min(1),

  referenceId: z.string().min(1),
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