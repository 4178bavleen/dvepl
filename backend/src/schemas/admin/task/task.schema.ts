import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  dueDate: z.string(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  assignedUserIds: z.array(z.string()).optional().default([]),
});

export const taskNotificationSchema = z.object({
  notifEnabled: z.boolean().default(true),
  notifType: z.enum(["automatic", "manual"]).default("automatic"),
  notifDays: z.number().default(1),
  notifUnit: z.enum(["days", "hours"]).default("days"),
  notifFrequency: z.enum(["once", "daily", "every-12h"]).default("once"),
});
