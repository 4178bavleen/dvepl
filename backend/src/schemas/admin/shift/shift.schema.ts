import { z } from "zod";

const timeStringRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createShiftSchema = z.object({
  name: z.string().min(1, "Shift name is required").trim(),
  startTime: z.string().regex(timeStringRegex, "Start time must be in HH:MM format (24-hour)"),
  endTime: z.string().regex(timeStringRegex, "End time must be in HH:MM format (24-hour)"),
});

export const updateShiftSchema = createShiftSchema.partial();

export const shiftIdParamSchema = z.object({
  id: z.string().uuid("Invalid shift id"),
});
