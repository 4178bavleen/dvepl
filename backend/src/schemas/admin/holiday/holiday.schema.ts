import { z } from "zod";

export const createHolidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required").trim(),
  date: z.coerce.date(),
  type: z.string().optional().nullable().transform(val => val ? val.trim().toUpperCase() : null),
});

export const updateHolidaySchema = createHolidaySchema.partial();

export const holidayIdParamSchema = z.object({
  id: z.string().uuid("Invalid holiday id"),
});
