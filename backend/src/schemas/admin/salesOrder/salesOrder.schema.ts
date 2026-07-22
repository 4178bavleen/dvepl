import { z } from "zod";

export const salesOrderItemSchema = z.object({
  itemCode: z
    .string()
    .min(1, "Item code is required"),

  description: z
    .string()
    .min(1, "Description is required"),

  quantity: z
    .number({
      error: "Quantity must be a number",
    })
    .positive(),

  rate: z
    .number({
      error: "Rate must be a number",
    })
    .nonnegative(),

  gstPercentage: z
    .number({
      error: "GST Percentage must be a number",
    })
    .min(0)
    .max(100),

  total: z
    .number({
      error: "Total must be a number",
    })
    .nonnegative(),

  remarks: z
    .string()
    .optional()
    .nullable(),
});

export const salesOrderSchema = z.object({
  companyId: z.string().uuid(),

  dveplCode: z
    .string()
    .min(1, "DVEPL Code is required"),

  status: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "ON_HOLD",
    ])
    .default("PENDING"),

  orderTakenById: z
    .string()
    .uuid()
    .optional()
    .nullable(),

  assignedToIds: z
    .array(z.string().uuid())
    .optional()
    .default([]),

  partyName: z
    .string()
    .min(1, "Party name is required"),

  caNo: z
    .string()
    .optional()
    .nullable(),

  contactDetails: z
    .string()
    .optional()
    .nullable(),

  orderConfirmDate: z
    .string()
    .optional()
    .nullable(),

  deliveryMonthTarget: z
    .string()
    .optional()
    .nullable(),

  poDate: z
    .string()
    .optional()
    .nullable(),

  drawingConcernedPerson: z
    .string()
    .optional()
    .nullable(),

  drawingApprovedDate: z
    .string()
    .optional()
    .nullable(),

  drawingStatus: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "ON_HOLD",
    ])
    .optional()
    .nullable(),

  drawingRemarks: z
    .string()
    .optional()
    .nullable(),

  inspectionField: z
    .string()
    .optional()
    .nullable(),

  sendNotification: z
    .boolean()
    .default(true),

  remarks: z
    .string()
    .optional()
    .nullable(),

  items: z
    .array(salesOrderItemSchema)
    .min(1, "At least one item is required"),
});

export type SalesOrderInput = z.infer<typeof salesOrderSchema>;