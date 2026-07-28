import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async getConfiguration() {
    const config = await prisma.notificationConfiguration.findFirst();

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

  static async createTransporter() {
    const config = await this.getConfiguration();

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

  static async send(options: SendEmailOptions) {
    const config = await this.getConfiguration();

    const transporter = await this.createTransporter();

    const info = await transporter.sendMail({
      from: `"${config.smtpFromName || "DVEPL"}" <${config.smtpFromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return info;
  }

  static async verify() {
    const transporter = await this.createTransporter();

    await transporter.verify();

    return true;
  }
}

export default EmailService;