import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import nodemailer from "nodemailer";
import { z } from "zod";
import { adminLogs } from "../../../services/logger/contextLogger";

const sendVendorFollowUpEmailSchema = z.object({
  vendorId: z.string().uuid(),
  subject: z.string().min(1),
  text: z.string().min(1),
  attachments: z
    .array(
      z.object({
        filename: z.string().min(1),
        content: z.string().min(1),
        encoding: z.string().optional(),
      }),
    )
    .optional(),
});

const toHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

async function sendVendorFollowUpEmailRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/send-vendor-follow-up-email",
    {
      schema: {
        tags: ["Settings"],
        summary: "Send Vendor Delivery Follow-up Email",
      },
      preHandler: [fastify.verifyToken],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = sendVendorFollowUpEmailSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "A valid vendor, subject, and follow-up message are required.",
          });
        }

const { vendorId, subject, text, attachments } = validation.data;
        const companyId = request.user.companyId;
        const vendor = await fastify.prisma.vendor.findFirst({
          where: { id: vendorId, companyId, deletedAt: null },
          select: { email: true },
        });

        if (!vendor) {
          return reply.status(404).send({
            success: false,
            message: "Vendor not found.",
          });
        }

        if (!vendor.email) {
          return reply.status(400).send({
            success: false,
            message: "The selected vendor does not have an email address.",
          });
        }

        const dbConfig = await fastify.prisma.notificationConfiguration.findUnique({
          where: { companyId },
        });
        const savedSettings = (await fastify.prisma.companySettings.findUnique({ where: { companyId } }))?.data as any || {};
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
            message: "SMTP host and port must be configured before sending a follow-up email.",
          });
        }

        const parsedPort = parseInt(String(smtpPort), 10);
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parsedPort,
          secure: parsedPort === 465,
          auth: smtpUsername && smtpPassword
            ? { user: smtpUsername, pass: smtpPassword }
            : undefined,
          connectionTimeout: 10000,
        });

await transporter.sendMail({
          from: `"${smtpFromName || "DVEPL ERP"}" <${smtpFromEmail || "no-reply@dvepl.com"}>`,
          to: vendor.email,
          subject,
          text,
          html: `<p>${toHtml(text)}</p>`,
          attachments: attachments || [],
        });

        return reply.send({
          success: true,
          message: "Vendor follow-up email sent successfully!",
          data: { toEmail: vendor.email },
        });
      } catch (error: any) {
        adminLogs.error("Send vendor follow-up email failed", { error });
        return reply.status(500).send({
          success: false,
          message: error.message || "Failed to send vendor follow-up email.",
        });
      }
    },
  );
}

export default sendVendorFollowUpEmailRoute;
