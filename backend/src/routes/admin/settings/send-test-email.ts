import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import nodemailer from "nodemailer";
import { adminLogs } from "../../../services/logger/contextLogger";

async function sendTestEmailRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/send-test-email",
    {
      schema: {
        tags: ["Settings"],
        summary: "Send Test Email",
        description: "Sends a test email using the specified SMTP settings.",
      },
      preHandler: [
        fastify.verifyToken
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { smtpSettings, toEmail, fromEmail, fromName, subject, text, html } = request.body as any;

        if (!smtpSettings?.host || !smtpSettings?.port || !toEmail) {
          return reply.status(400).send({
            success: false,
            message: "SMTP settings and destination email address are required.",
          });
        }

        const parsedPort = parseInt(String(smtpSettings.port), 10);
        const transporter = nodemailer.createTransport({
          host: smtpSettings.host,
          port: parsedPort,
          secure: parsedPort === 465,
          auth: smtpSettings.username && smtpSettings.password ? {
            user: smtpSettings.username,
            pass: smtpSettings.password,
          } : undefined,
          connectionTimeout: 10000,
        });

        let status: "SENT" | "FAILED" = "SENT";
        let errorMsg: string | null = null;
        const mailSubject = subject || "DVEPL SMTP Connection Test";
        const mailHtml = html || "<p>Hello,</p><p>This is a test email sent from the DVEPL ERP Settings page. If you are reading this, your SMTP configuration is successfully working!</p><p>Regards,<br>DVEPL Team</p>";

        try {
          await transporter.sendMail({
            from: `"${fromName || "DVEPL Test"}" <${fromEmail || smtpSettings.username || "test@dvepl.com"}>`,
            to: toEmail,
            subject: mailSubject,
            text: text || "Hello,\n\nThis is a test email sent from the DVEPL ERP Settings page. If you are reading this, your SMTP configuration is successfully working!\n\nRegards,\nDVEPL Team",
            html: mailHtml,
          });
        } catch (e: any) {
          status = "FAILED";
          errorMsg = e.message || String(e);
          throw e;
        } finally {
          try {
            await fastify.prisma.notificationLog.create({
              data: {
                eventCode: "TEST_EMAIL",
                channel: "EMAIL",
                recipient: toEmail,
                subject: mailSubject,
                message: mailHtml.replace(/<[^>]*>/g, '').trim(),
                status: status,
                error: errorMsg,
              }
            });
          } catch (dbError) {
            adminLogs.error("Failed to write test email to notificationLog", { error: dbError });
          }
        }

        return reply.status(200).send({
          success: true,
          message: "Test email sent successfully!",
        });
      } catch (error: any) {
        adminLogs.error("Send Test Email failed", { error });
        return reply.status(500).send({
          success: false,
          message: error.message || "Failed to send email.",
        });
      }
    }
  );
}

export default sendTestEmailRoute;
