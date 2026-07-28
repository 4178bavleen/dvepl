export const notificationConfigUpdateSchema = z.object({
  emailEnabled: z.boolean(),

  smtpHost: z.string().trim().optional().nullable(),
  smtpPort: z.coerce.number().optional().nullable(),
  smtpUsername: z.string().trim().optional().nullable(),
  smtpPassword: z.string().trim().optional().nullable(),
  smtpFromEmail: z.string().email().optional().nullable(),
  smtpFromName: z.string().trim().optional().nullable(),

  whatsappEnabled: z.boolean(),

  whatsappProvider: z.nativeEnum(NotificationProvider).optional().nullable(),

  whatsappApiKey: z.string().optional().nullable(),
  whatsappEndpoint: z.string().optional().nullable(),
});

export const notificationEventUpdateSchema = z.object({
  emailEnabled: z.boolean(),

  whatsappEnabled: z.boolean(),

  isActive: z.boolean(),
});

export const notificationRecipientCreateSchema = z.object({
  eventId: z.string().uuid(),

  employeeId: z.string().uuid().optional().nullable(),

  email: z.string().email().optional().nullable(),

  phone: z.string().optional().nullable(),
});

export const notificationRecipientUpdateSchema =
  notificationRecipientCreateSchema.extend({
    isActive: z.boolean(),
  });

  export const notificationTemplateCreateSchema = z.object({
  eventId: z.string().uuid(),

  channel: z.nativeEnum(NotificationChannel),

  subject: z.string().optional().nullable(),

  body: z.string().min(1),
});

export const notificationTemplateUpdateSchema =
  notificationTemplateCreateSchema.extend({
    isActive: z.boolean(),
  });

  export const notificationLogQuerySchema = z.object({
  page: z.coerce.number().default(1),

  limit: z.coerce.number().default(10),

  search: z.string().optional(),

  channel: z.nativeEnum(NotificationChannel).optional(),

  status: z.nativeEnum(NotificationStatus).optional(),
});
export const notificationEventUpdateSchema = z.object({
  emailEnabled: z.boolean(),

  whatsappEnabled: z.boolean(),

  isActive: z.boolean(),
});
