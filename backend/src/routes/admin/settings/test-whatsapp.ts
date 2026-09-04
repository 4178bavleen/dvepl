import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { WhatsappService } from "../../../services/notification/whatsapp.service";

async function testWhatsappRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/test-whatsapp",
    {
      schema: {
        tags: ["Settings"],
        summary: "Test WhatsApp Connection",
        description: "Tests the WhatsApp gateway API connection with AiSensy.",
      },
      preHandler: [
        fastify.verifyToken
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { provider, apiKey, campaignName, number } = request.body as any;

        if (!provider) {
          return reply.status(400).send({
            success: false,
            message: "Provider is required.",
          });
        }

        if (provider.toUpperCase() !== "AISENSY") {
          return reply.status(400).send({
            success: false,
            message: "Only AiSensy provider is supported for WhatsApp testing.",
          });
        }

        if (!apiKey) {
          return reply.status(400).send({
            success: false,
            message: "AiSensy API key is required.",
          });
        }

        const result = await WhatsappService.verifyWithCredentials({
          apiKey,
          campaignName,
          number,
        });

        return reply.status(200).send({
          success: true,
          message: result.message,
        });
      } catch (error: any) {
        adminLogs.error("WhatsApp Gateway connection failed", {
          error: error.message,
        });
        return reply.status(500).send({
          success: false,
          message: error.message || "Failed to connect to WhatsApp Gateway.",
        });
      }
    }
  );
}

export default testWhatsappRoute;
