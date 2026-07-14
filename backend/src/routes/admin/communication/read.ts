import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { communicationListQuerySchema } from "../../../schemas/admin/communication/communication.schema";

async function readCommunicationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read communication history for a specific customer
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Communication History"],
        summary: "List Customer Communications",
        description: "Returns communication history logs for a customer.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Query Validation
        //--------------------------------
        const validation = communicationListQuerySchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid query parameters.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const { customerId } = validation.data;

        //--------------------------------
        // Tenant Verification
        //--------------------------------
        const customer = await fastify.prisma.customer.findFirst({
          where: { id: customerId, companyId, deletedAt: null },
        });

        if (!customer) {
          return reply.status(404).send({
            success: false,
            message: "Customer not found.",
          });
        }

        const logs = await fastify.prisma.communicationHistory.findMany({
          where: { customerId },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Customer communications fetched successfully.",
          data: logs,
        });
      } catch (error: any) {
        adminLogs.error("List Customer Communications failed", { error });
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

  // Read communication log details by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Communication History"],
        summary: "Read Communication Log Details",
        description: "Returns detailed information of a customer communication history log.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Fetch Log with tenant check
        //--------------------------------
        const log = await fastify.prisma.communicationHistory.findFirst({
          where: {
            id,
            customer: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!log) {
          return reply.status(404).send({
            success: false,
            message: "Communication log not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Communication log details fetched successfully.",
          data: log,
        });
      } catch (error: any) {
        adminLogs.error("Read communication log details failed", { error });
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

export default readCommunicationRoutes;
