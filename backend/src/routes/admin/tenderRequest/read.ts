import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readTenderRequestRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all tender requests
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tender Request"],
        summary: "Read Tender Requests",
        description: "Returns all active tender requests for the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.view"]),
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

        const tenderRequests = await fastify.prisma.tenderRequest.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            customer: {
              select: { id: true, name: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Tender requests fetched successfully.",
          data: tenderRequests,
        });
      } catch (error: any) {
        adminLogs.error("Read Tender Requests failed", { error });
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

  // Read tender request by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tender Request"],
        summary: "Read Tender Request By Id",
        description: "Returns detailed information of a tender request.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.view"]),
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

        const { id } = request.params as { id: string };

        const tenderRequest = await fastify.prisma.tenderRequest.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
          include: {
            customer: {
              include: {
                contacts: {
                  where: { deletedAt: null, isPrimary: true },
                },
              },
            },
            assignedTo: {
              select: { id: true, name: true, email: true, phone: true },
            },
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        });

        if (!tenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request not found.",
          });
        }

        const activities = await fastify.prisma.auditLog.findMany({
          where: {
            module: "TenderRequest",
            recordId: id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const tenderRequestWithActivities = {
          ...tenderRequest,
          activities,
        };

        return reply.status(200).send({
          success: true,
          message: "Tender request details fetched successfully.",
          data: tenderRequestWithActivities,
        });
      } catch (error: any) {
        adminLogs.error("Read Tender Request By Id failed", { error });
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

export default readTenderRequestRoutes;
