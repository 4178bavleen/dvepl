import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async getConfiguration(companyId?: string) {
    const config = await prisma.notificationConfiguration.findFirst({
      where: companyId ? { companyId } : {},
    });

    if (!config) {
      throw new Error("Notification configuration not found.");
    }

    if (!config.emailEnabled) {
      throw new Error("Email notifications are disabled.");
    }

    if (
      !config.smtpHost ||
      !config.smtpPort ||
      !config.smtpUsername ||
      !config.smtpPassword ||
      !config.smtpFromEmail
    ) {
      throw new Error("SMTP configuration is incomplete.");
    }

    return config;
  }

  static async createTransporter(companyId?: string) {
    const config = await this.getConfiguration(companyId);

    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword,
      },
    });
  }

  static async send(options: SendEmailOptions, companyId?: string) {
    const config = await this.getConfiguration(companyId);

    const transporter = await this.createTransporter(companyId);

    const info = await transporter.sendMail({
      from: `"${config.smtpFromName || "DVEPL"}" <${config.smtpFromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return info;
  }

  static async verify(companyId?: string) {
    const transporter = await this.createTransporter(companyId);

    await transporter.verify();

    return true;
  }
}

export default EmailService;