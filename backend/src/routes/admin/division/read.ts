import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readDivisionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all divisions for company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Division"],
        summary: "Read Divisions",
        description: "Returns all divisions under the authenticated company.",
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

        const divisions = await fastify.prisma.division.findMany({
          where: {
            section: {
              department: {
                branch: {
                  companyId,
                },
              },
            },
            deletedAt: null,
          },
          include: {
            section: {
              select: {
                id: true,
                name: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Divisions fetched successfully.",
          data: divisions,
        });
      } catch (error: any) {
        adminLogs.error("Read divisions failed", { error });
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

  // Read by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Division"],
        summary: "Read Division By Id",
        description: "Returns detailed information of a division.",
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

        const { id } = request.params as { id: string };

        const division = await fastify.prisma.division.findFirst({
          where: {
            id,
            section: {
              department: {
                branch: {
                  companyId,
                },
              },
            },
            deletedAt: null,
          },
          include: {
            section: true,
            subDivisions: {
              where: { deletedAt: null },
            },
          },
        });

        if (!division) {
          return reply.status(404).send({
            success: false,
            message: "Division not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Division details fetched successfully.",
          data: division,
        });
      } catch (error: any) {
        adminLogs.error("Read division by id failed", { error });
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

export default readDivisionRoutes;
