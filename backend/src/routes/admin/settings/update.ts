import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { settingsSchema } from "../../../schemas/admin/settings/settings.schema";
import { encrypt } from "../../../utils/encryption";

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

        const companyId = request.user.companyId;

        // Upsert database notification configuration
        if (companyId) {
          const emailEnabled = !!(
            (validationResult.data.smtpSettings?.host && validationResult.data.smtpSettings?.port) ||
            (validationResult.data.emailSettings as any)?.orders ||
            (validationResult.data.emailSettings as any)?.tasks ||
            (validationResult.data.emailSettings as any)?.payments ||
            (validationResult.data.emailSettings as any)?.delivery ||
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
          if (p === "SMTP" || p === "META" || p === "TWILIO" || p === "WATI" || p === "AISENSY") {
            providerEnum = p;
          }

          const smtpPortVal = validationResult.data.smtpSettings?.port 
            ? parseInt(String(validationResult.data.smtpSettings.port), 10) 
            : null;

          const rawApiKey = validationResult.data.gatewaySettings?.apiKey;
          const encryptedApiKey = rawApiKey ? encrypt(rawApiKey) : null;

          const upsertData = {
            emailEnabled,
            smtpHost: validationResult.data.smtpSettings?.host || null,
            smtpPort: isNaN(smtpPortVal as any) ? null : smtpPortVal,
            smtpUsername: validationResult.data.smtpSettings?.username || null,
            smtpPassword: validationResult.data.smtpSettings?.password || null,
            smtpFromEmail: validationResult.data.smtpSettings?.username || validationResult.data.emailSettings?.address || null,
            smtpFromName: validationResult.data.smtpSettings?.title || validationResult.data.emailSettings?.name || null,
            whatsappEnabled: validationResult.data.gatewaySettings?.enabled ?? whatsappEnabled,
            whatsappProvider: providerEnum,
            whatsappEndpoint: validationResult.data.gatewaySettings?.instanceId || validationResult.data.gatewaySettings?.baseUrl || null,
            whatsappCampaignName: validationResult.data.gatewaySettings?.campaignName || null,
            whatsappNumber: validationResult.data.gatewaySettings?.number || null,
          };

          const existingConfig = await fastify.prisma.notificationConfiguration.findUnique({ where: { companyId } });

          const createData = {
            ...upsertData,
            companyId,
            ...(encryptedApiKey ? { whatsappApiKey: encryptedApiKey } : {}),
          };

          const updateData: any = {
            ...upsertData,
          };

          if (encryptedApiKey) {
            updateData.whatsappApiKey = encryptedApiKey;
          }

          await fastify.prisma.notificationConfiguration.upsert({
            where: { companyId },
            update: updateData,
            create: createData,
          });
        }

        const existingSettings = await fastify.prisma.companySettings.findUnique({ where: { companyId } });
        const updatedSettings = {
          ...((existingSettings?.data as object) || {}),
          ...validationResult.data,
        };
        await fastify.prisma.companySettings.upsert({
          where: { companyId },
          create: { companyId, data: updatedSettings },
          update: { data: updatedSettings },
        });

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
