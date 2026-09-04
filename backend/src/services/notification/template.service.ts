import Handlebars from "handlebars";
import {
  NotificationChannel,
  NotificationEventCode,
} from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface TemplateVariables {
  [key: string]: any;
}

export interface RenderTemplateOptions {
  eventCode: NotificationEventCode;
  channel: NotificationChannel;
  variables?: TemplateVariables;
}

class TemplateService {
  static async getTemplate(
    eventCode: NotificationEventCode,
    channel: NotificationChannel
  ) {
    const event = await prisma.notificationEvent.findUnique({
      where: {
        code: eventCode,
      },
    });

    if (!event) {
      throw new Error(`Notification event '${eventCode}' not found.`);
    }

    const template =
      await prisma.notificationTemplate.findFirst({
        where: {
          eventId: event.id,
          channel,
          isActive: true,
        },
      });

    if (!template) {
      throw new Error(
        `Template not found for ${eventCode} (${channel}).`
      );
    }

    return template;
  }

  static async render({
    eventCode,
    channel,
    variables = {},
  }: RenderTemplateOptions) {
    const template = await this.getTemplate(
      eventCode,
      channel
    );

    const subject = template.subject
      ? Handlebars.compile(template.subject)(variables)
      : "";

    const body = Handlebars.compile(template.body)(
      variables
    );

    return {
      eventCode,
      subject,
      body,
      templateId: template.id,
    };
  }
}

export default TemplateService;