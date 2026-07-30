import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import nodemailer from "nodemailer";
import { adminLogs } from "../../../services/logger/contextLogger";

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
        const { toEmail, subject, text, html, pdfBase64, poNumber } = request.body as any;

        if (!toEmail) {
          return reply.status(400).send({
            success: false,
            message: "Destination email address is required.",
          });
        }

        let companyId = (request.admin as any)?.companyId;
        if (!companyId) {
          const firstCompany = await fastify.prisma.company.findFirst();
          if (firstCompany) companyId = firstCompany.id;
        }

        if (!companyId) {
          return reply.status(400).send({
            success: false,
            message: "Company ID not found.",
          });
        }

        const dbConfig = await fastify.prisma.notificationConfiguration.findUnique({
          where: { companyId }
        });

        if (!dbConfig || !dbConfig.emailEnabled || !dbConfig.smtpHost || !dbConfig.smtpPort) {
          return reply.status(400).send({
            success: false,
            message: "Email notifications are not configured or disabled in settings.",
          });
        }

        const parsedPort = parseInt(String(dbConfig.smtpPort), 10);
        const transporter = nodemailer.createTransport({
          host: dbConfig.smtpHost,
          port: parsedPort,
          secure: parsedPort === 465,
          auth: dbConfig.smtpUsername && dbConfig.smtpPassword ? {
            user: dbConfig.smtpUsername,
            pass: dbConfig.smtpPassword,
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
          from: `"${dbConfig.smtpFromName || "DVEPL ERP"}" <${dbConfig.smtpFromEmail || dbConfig.smtpUsername || "no-reply@dvepl.com"}>`,
          to: toEmail,
          subject: subject || `Purchase Order ${poNumber || ""}`,
          text: text || "Please find the attached Purchase Order.",
          html: html || `<p>Please find the attached Purchase Order.</p>`,
          attachments,
        });

        return reply.status(200).send({
          success: true,
          message: "PO Email sent successfully!",
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
