import { z } from "zod";

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee id"),
  date: z.coerce.date(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"]),
  checkIn: z.coerce.date().optional().nullable(),
  checkOut: z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable().transform(val => val === "" ? null : val),
}).refine(data => {
  if (data.checkIn && data.checkOut) {
    return data.checkOut >= data.checkIn;
  }
  return true;
}, {
  message: "Check-out time (checkOut) must be after or equal to check-in time (checkIn)",
  path: ["checkOut"],
});

export const updateAttendanceSchema = z.object({
  employeeId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"]).optional(),
  checkIn: z.coerce.date().optional().nullable(),
  checkOut: z.coerce.date().optional().nullable(),
  remarks: z.string().optional().nullable().transform(val => val === "" ? null : val),
}).refine(data => {
  if (data.checkIn && data.checkOut) {
    return data.checkOut >= data.checkIn;
  }
  return true;
}, {
  message: "Check-out time (checkOut) must be after or equal to check-in time (checkIn)",
  path: ["checkOut"],
});

export const attendanceIdParamSchema = z.object({
  id: z.string().uuid("Invalid attendance id"),
});
