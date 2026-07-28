import {
  NotificationChannel,
  NotificationStatus,
  PrismaClient,
} from "@prisma/client";

import EmailService from "./email.service";
import TemplateService from "./template.service";
// import WhatsAppService from "./whatsapp.service";

const prisma = new PrismaClient();

export interface NotificationPayload {
  eventCode: string;

  variables?: Record<string, any>;

  relatedModule?: string;

  relatedRecordId?: string;
}

class NotificationService {
  static async send(payload: NotificationPayload) {
    const event = await prisma.notificationEvent.findUnique({
      where: {
        code: payload.eventCode,
      },
    });

    if (!event) {
      throw new Error(`Notification event '${payload.eventCode}' not found.`);
    }

    if (!event.isActive) {
      return;
    }

    const recipients = await prisma.notificationRecipient.findMany({
      where: {
        eventId: event.id,
        isActive: true,
      },
      include: {
        employee: true,
      },
    });

    // ===============================
    // EMAIL
    // ===============================

    if (event.emailEnabled) {
      const template = await TemplateService.render({
        eventCode: payload.eventCode,
        channel: NotificationChannel.EMAIL,
        variables: payload.variables,
      });

      for (const recipient of recipients) {
        const email =
          recipient.email ||
          recipient.employee?.officialEmail ||
          recipient.employee?.personalEmail;

        if (!email) continue;

        try {
          await EmailService.send({
            to: email,
            subject: template.subject,
            html: template.body,
          });

          await prisma.notificationLog.create({
            data: {
              eventCode: payload.eventCode,

              channel: NotificationChannel.EMAIL,

              recipient: email,

              subject: template.subject,

              message: template.body,

              status: NotificationStatus.SENT,

              relatedModule: payload.relatedModule,

              relatedRecordId: payload.relatedRecordId,

              sentAt: new Date(),
            },
          });
        } catch (error: any) {
          await prisma.notificationLog.create({
            data: {
              eventCode: payload.eventCode,

              channel: NotificationChannel.EMAIL,

              recipient: email,

              subject: template.subject,

              message: template.body,

              status: NotificationStatus.FAILED,

              error: error.message,

              relatedModule: payload.relatedModule,

              relatedRecordId: payload.relatedRecordId,
            },
          });
        }
      }
    }

    // ===============================
    // WHATSAPP
    // ===============================

    if (event.whatsappEnabled) {
      const template = await TemplateService.render({
        eventCode: payload.eventCode,
        channel: NotificationChannel.WHATSAPP,
        variables: payload.variables,
      });

      for (const recipient of recipients) {
        const phone =
          recipient.phone ||
          recipient.employee?.phone;

        if (!phone) continue;

        try {
          // await WhatsAppService.send({
          //     phone,
          //     message: template.body,
          // });

          await prisma.notificationLog.create({
            data: {
              eventCode: payload.eventCode,

              channel: NotificationChannel.WHATSAPP,

              recipient: phone,

              message: template.body,

              status: NotificationStatus.SENT,

              relatedModule: payload.relatedModule,

              relatedRecordId: payload.relatedRecordId,

              sentAt: new Date(),
            },
          });
        } catch (error: any) {
          await prisma.notificationLog.create({
            data: {
              eventCode: payload.eventCode,

              channel: NotificationChannel.WHATSAPP,

              recipient: phone,

              message: template.body,

              status: NotificationStatus.FAILED,

              error: error.message,

              relatedModule: payload.relatedModule,

              relatedRecordId: payload.relatedRecordId,
            },
          });
        }
      }
    }
  }
}

export default NotificationService;