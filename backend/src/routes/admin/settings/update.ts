import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import fs from "fs";
import path from "path";
import { adminLogs } from "../../../services/logger/contextLogger";
import { settingsSchema } from "../../../schemas/admin/settings/settings.schema";

async function updateSettingsRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Settings"],
        summary: "Update Settings",
        description: "Updates company-wide settings.",
      },
      preHandler: [
        fastify.verifyToken
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = settingsSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid settings data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid settings data.",
            error: validationResult.error.issues,
          });
        }

        let companyId = (request.admin as any)?.companyId;
        if (!companyId) {
          const firstCompany = await fastify.prisma.company.findFirst();
          if (firstCompany) companyId = firstCompany.id;
        }

        // Upsert database notification configuration
        if (companyId) {
          const emailEnabled = !!(
            validationResult.data.emailSettings?.orderGen ||
            validationResult.data.emailSettings?.gatePass ||
            validationResult.data.emailSettings?.paymentRel ||
            validationResult.data.emailSettings?.clientNotify
          );
          const whatsappEnabled = !!(
            validationResult.data.waSettings?.orderGen ||
            validationResult.data.waSettings?.gatePass ||
            validationResult.data.waSettings?.paymentRel ||
            validationResult.data.waSettings?.clientNotify
          );

          let providerEnum: any = null;
          const p = validationResult.data.gatewaySettings?.provider?.toUpperCase();
          if (p === "SMTP" || p === "META" || p === "TWILIO" || p === "WATI") {
            providerEnum = p;
          }

          const smtpPortVal = validationResult.data.smtpSettings?.port 
            ? parseInt(String(validationResult.data.smtpSettings.port), 10) 
            : null;

          await fastify.prisma.notificationConfiguration.upsert({
            where: { companyId },
            update: {
              emailEnabled,
              smtpHost: validationResult.data.smtpSettings?.host || null,
              smtpPort: isNaN(smtpPortVal as any) ? null : smtpPortVal,
              smtpUsername: validationResult.data.smtpSettings?.username || null,
              smtpPassword: validationResult.data.smtpSettings?.password || null,
              smtpFromEmail: validationResult.data.smtpSettings?.username || validationResult.data.emailSettings?.address || null,
              smtpFromName: validationResult.data.smtpSettings?.title || validationResult.data.emailSettings?.name || null,
              whatsappEnabled: validationResult.data.gatewaySettings?.enabled ?? whatsappEnabled,
              whatsappProvider: providerEnum,
              whatsappApiKey: validationResult.data.gatewaySettings?.apiKey || null,
              whatsappEndpoint: validationResult.data.gatewaySettings?.instanceId || validationResult.data.gatewaySettings?.baseUrl || null,
            },
            create: {
              companyId,
              emailEnabled,
              smtpHost: validationResult.data.smtpSettings?.host || null,
              smtpPort: isNaN(smtpPortVal as any) ? null : smtpPortVal,
              smtpUsername: validationResult.data.smtpSettings?.username || null,
              smtpPassword: validationResult.data.smtpSettings?.password || null,
              smtpFromEmail: validationResult.data.smtpSettings?.username || validationResult.data.emailSettings?.address || null,
              smtpFromName: validationResult.data.smtpSettings?.title || validationResult.data.emailSettings?.name || null,
              whatsappEnabled: validationResult.data.gatewaySettings?.enabled ?? whatsappEnabled,
              whatsappProvider: providerEnum,
              whatsappApiKey: validationResult.data.gatewaySettings?.apiKey || null,
              whatsappEndpoint: validationResult.data.gatewaySettings?.instanceId || validationResult.data.gatewaySettings?.baseUrl || null,
            }
          });
        }

        const filePath = path.join(__dirname, "../../../../data/settings.json");
        const dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        let existingSettings = {};
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, "utf-8");
          try {
            existingSettings = JSON.parse(fileData);
          } catch (e) {
            existingSettings = {};
          }
        }

        const updatedSettings = {
          ...existingSettings,
          ...validationResult.data,
        };

        fs.writeFileSync(filePath, JSON.stringify(updatedSettings, null, 2), "utf-8");

        adminLogs.info("Settings updated successfully");

        return reply.status(200).send({
          success: true,
          message: "Settings updated successfully.",
          data: updatedSettings,
        });
      } catch (error: any) {
        adminLogs.error("Update Settings failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error while saving settings.",
        });
      }
    }
  );
}

export default updateSettingsRoute;
