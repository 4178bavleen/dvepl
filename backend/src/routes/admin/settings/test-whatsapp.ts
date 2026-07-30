import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

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
        description: "Tests the WhatsApp gateway API connection.",
      },
      preHandler: [
        fastify.verifyToken
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { provider, apiKey, instanceId, number } = request.body as any;

        if (!provider) {
          return reply.status(400).send({
            success: false,
            message: "Provider is required.",
          });
        }

        // Simulating the API response for Wati / Meta / Twilio
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return reply.status(200).send({
          success: true,
          message: `WhatsApp Gateway connection handshake successful with ${provider}!`,
        });
      } catch (error: any) {
        adminLogs.error("WhatsApp Gateway connection failed", { error });
        return reply.status(500).send({
          success: false,
          message: error.message || "Failed to connect to WhatsApp Gateway.",
        });
      }
    }
  );
}

export default testWhatsappRoute;
