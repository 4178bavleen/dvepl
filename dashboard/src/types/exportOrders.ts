import { z } from "zod";

const stringValue = z.string().nullish().transform((value) => value ?? "");
const numberValue = z.coerce.number().catch(0);

// ============================================================
// Sales Order Assignment
// ============================================================

export const salesOrderAssignmentSchema = z
  .object({
    id: z.string().optional(),
    salesOrderId: z.string().optional(),
    userId: z.string(),
    user: z
      .object({
        id: z.string(),
        name: z.string(),
        email: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

// ============================================================
// Export Order
// ============================================================

export const exportOrderSchema = z
  .object({
    id: z.string(),
    dveplCode: stringValue,
    partyName: stringValue,
    status: stringValue,
    grandTotal: numberValue,
    deliveryMonthTarget: stringValue,
    orderConfirmDate: stringValue,

    items: z
      .array(z.object({ quantity: numberValue }).passthrough())
      .catch([]),

    assignments: z.array(salesOrderAssignmentSchema).catch([]),
  })
  .passthrough();

// ============================================================
// Drawing User
// ============================================================

export const drawingUserSchema = z
  .object({
    id: z.string(),
    name: stringValue,
  })
  .passthrough();

// ============================================================
// Drawing Revision
// ============================================================

export const drawingRevisionSchema = z.object({
  id: z.string(),
  drawingId: z.string(),
  revisionNo: z.coerce.number(),
  revisionLabel: z.string().optional(),

  fileUrl: stringValue,
  fileName: stringValue,
  fileSize: z.coerce.number().nullable().catch(null),
  mimeType: z.string().nullable().catch(null),

  changes: z.string().nullable().optional(),

  status: stringValue,

  submittedAt: z.string().nullable().optional(),

  approvedById: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),

  rejectedById: z.string().nullable().optional(),
  rejectedAt: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),

  createdById: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  createdBy: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().optional(),

  approvedBy: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().optional(),

  rejectedBy: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable().optional(),
}).passthrough();


export const engineeringDrawingSchema = z.object({
  id: z.string(),
  drawingNo: stringValue,
  title: stringValue,
  description: z.string().nullable().optional(),
  drawingType: stringValue,

  fileUrl: stringValue,
  fileName: stringValue,
  fileSize: z.coerce.number().nullable().catch(null),
  mimeType: z.string().nullable().catch(null),

  status: stringValue,

  rejectionReason: z.string().nullable().optional(),

  approvedById: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),

  version: z.coerce.number().optional(),

  project: z.object({
    id: z.string(),
    name: stringValue,
    salesOrderId: z.string(),
  }).nullable().optional(),

  revisions: z.array(drawingRevisionSchema).catch([]),

  currentRevision: drawingRevisionSchema.nullable().optional(),
}).passthrough();

// ============================================================
// API Response Schemas
// ============================================================

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

// ============================================================
// File Upload Response
// ============================================================

export const uploadedFileResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    fileName: z.string(),
    fileUrl: z.string().min(1),
    mimeType: z.string().optional(),
  }),
  message: z.string().optional(),
});

// ============================================================
// Types
// ============================================================

export type ExportOrder = z.infer<typeof exportOrderSchema>;

export type EngineeringDrawing = z.infer<
  typeof engineeringDrawingSchema
>;



export type DrawingUser = z.infer<
  typeof drawingUserSchema
>;
export type DrawingRevision = z.infer<typeof drawingRevisionSchema>;

export type SalesOrderAssignment = z.infer<
  typeof salesOrderAssignmentSchema
>;

// ============================================================
// Filters
// ============================================================

export interface ExportOrderFilters {
  search?: string;
  status?: string;
  assignedEngineer?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================
// Revision Creation Payload
// ============================================================

export interface CreateDrawingRevisionPayload {
  drawingId: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  changes?: string | null;
}

// ============================================================
// Drawing Status Update Payload
// ============================================================

export interface UpdateDrawingStatusPayload {
  status: string;
  rejectionReason?: string | null;
}
export const drawingRevisionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(drawingRevisionSchema),
  message: z.string().optional(),
});

export const drawingRevisionResponseSchema = z.object({
  success: z.literal(true),
  data: drawingRevisionSchema,
  message: z.string().optional(),
});
