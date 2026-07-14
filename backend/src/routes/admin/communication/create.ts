import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createCommunicationHistorySchema } from "../../../schemas/admin/communication/communication.schema";

async function createCommunicationRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Communication History"],
        summary: "Log Customer Communication",
        description: "Logs a communication interaction (CALL, EMAIL, WHATSAPP, SMS, NOTE) with a customer.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------
        const validation = createCommunicationHistorySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const data = validation.data;
        const companyId = request.admin?.companyId;
        const userId = request.admin?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Check Customer & Tenant
        //--------------------------------
        const customer = await fastify.prisma.customer.findFirst({
          where: { id: data.customerId, companyId, deletedAt: null },
        });

        if (!customer) {
          return reply.status(404).send({
            success: false,
            message: "Customer not found.",
          });
        }

        //--------------------------------
        // Create Log
        //--------------------------------
        const log = await fastify.prisma.communicationHistory.create({
          data: {
            ...data,
            userId,
          },
        });

        adminLogs.info("Communication logged successfully", {
          logId: log.id,
          customerId: log.customerId,
        });

        return reply.status(201).send({
          success: true,
          message: "Communication logged successfully.",
          data: log,
        });
      } catch (error: any) {
        adminLogs.error("Communication logging failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createCommunicationRoute;
