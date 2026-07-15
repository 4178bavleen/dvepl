import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readCounterRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all counters for the tenant company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Reference Code Counter"],
        summary: "List Reference Code Counters",
        description: "Returns all sequence counters for the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
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

        const counters = await fastify.prisma.referenceCodeCounter.findMany({
          where: { companyId },
          orderBy: { prefix: "asc" },
        });

        return reply.status(200).send({
          success: true,
          message: "Reference code counters fetched successfully.",
          data: counters,
        });
      } catch (error: any) {
        adminLogs.error("Read reference code counters failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );

  // Read counter by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Reference Code Counter"],
        summary: "Get Reference Code Counter Details",
        description: "Returns details of a specific reference code counter.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
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

        const counter = await fastify.prisma.referenceCodeCounter.findFirst({
          where: { id, companyId },
        });

        if (!counter) {
          return reply.status(404).send({
            success: false,
            message: "Reference code counter not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Reference code counter details fetched successfully.",
          data: counter,
        });
      } catch (error: any) {
        adminLogs.error("Read reference code counter by ID failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );
}

export default readCounterRoutes;
