import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import nodemailer from "nodemailer";
import { PurchaseOrderStatus } from "@prisma/client";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { adminLogs } from "../../../services/logger/contextLogger";

const sendPoEmailSchema = z.object({
  vendorId: z.string().uuid(),
  poNumber: z.string().min(1),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  pdfBase64: z.string().min(1),
});

async function sendPoEmailRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/send-po-email",
    {
      schema: {
        tags: ["Settings"],
        summary: "Send Purchase Order Email",
        description: "Sends a Purchase Order email using the configured SMTP settings.",
      },
      preHandler: [
        fastify.verifyToken
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = sendPoEmailSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "A valid vendor, PO number, and PDF attachment are required.",
          });
        }

        const { vendorId, poNumber, subject, text, html, pdfBase64 } = validation.data;
        const companyId = request.user.companyId;

        const purchaseOrder = await fastify.prisma.purchaseOrder.findFirst({
          where: {
            companyId,
            vendorId,
            poNo: poNumber,
            deletedAt: null,
          },
          include: {
            vendor: true,
          },
        });

        if (!purchaseOrder) {
          return reply.status(404).send({
            success: false,
            message: "Purchase Order not found. Save the PO before sending it.",
          });
        }

        if (!purchaseOrder.vendor.email) {
          return reply.status(400).send({
            success: false,
            message: "The selected vendor does not have an email address.",
          });
        }

        const dbConfig = await fastify.prisma.notificationConfiguration.findUnique({
          where: { companyId }
        });

        const settingsPath = path.join(__dirname, "../../../../data/settings.json");
        const savedSettings = fs.existsSync(settingsPath)
          ? JSON.parse(fs.readFileSync(settingsPath, "utf-8"))
          : {};
        const savedSmtp = savedSettings.smtpSettings || {};

        const smtpHost = dbConfig?.smtpHost || savedSmtp.host;
        const smtpPort = dbConfig?.smtpPort || savedSmtp.port;
        const smtpUsername = dbConfig?.smtpUsername || savedSmtp.username || savedSmtp.email;
        const smtpPassword = dbConfig?.smtpPassword || savedSmtp.password;
        const smtpFromEmail = dbConfig?.smtpFromEmail || savedSettings.emailSettings?.address || smtpUsername;
        const smtpFromName = dbConfig?.smtpFromName || savedSmtp.title || savedSettings.emailSettings?.name;

        if (!smtpHost || !smtpPort) {
          return reply.status(400).send({
            success: false,
            message: "SMTP host and port must be configured before sending a PO email.",
          });
        }

        const parsedPort = parseInt(String(smtpPort), 10);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parsedPort,
          secure: parsedPort === 465,
          auth: smtpUsername && smtpPassword ? {
            user: smtpUsername,
            pass: smtpPassword,
          } : undefined,
          connectionTimeout: 10000,
        });

        const attachments = pdfBase64 ? [
          {
            filename: `PO_${poNumber || "Order"}.pdf`,
            content: pdfBase64,
            encoding: 'base64',
          }
        ] : [];

        await transporter.sendMail({
          from: `"${smtpFromName || "DVEPL ERP"}" <${smtpFromEmail || "no-reply@dvepl.com"}>`,
          to: purchaseOrder.vendor.email,
          subject: subject || `Purchase Order ${poNumber || ""}`,
          text: text || "Please find the attached Purchase Order.",
          html: html || `<p>Please find the attached Purchase Order.</p>`,
          attachments,
        });

        await fastify.prisma.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: {
            status: PurchaseOrderStatus.SENT,
            sentAt: new Date(),
          },
        });

        return reply.status(200).send({
          success: true,
          message: "PO Email sent successfully!",
          data: { toEmail: purchaseOrder.vendor.email },
        });
      } catch (error: any) {
        adminLogs.error("Send PO Email failed", { error });
        return reply.status(500).send({
          success: false,
          message: error.message || "Failed to send PO email.",
        });
      }
    }
  );
}

export default sendPoEmailRoute;
