import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readSubDivisionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all sub-divisions for company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Sub-Division"],
        summary: "Read Sub-Divisions",
        description: "Returns all sub-divisions under the authenticated company.",
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

        const subDivisions = await fastify.prisma.subDivision.findMany({
          where: {
            division: {
              section: {
                department: {
                  branch: {
                    companyId,
                  },
                },
              },
            },
            deletedAt: null,
          },
          include: {
            division: {
              select: {
                id: true,
                name: true,
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
            },
          },
          orderBy: {
            name: "asc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Sub-Divisions fetched successfully.",
          data: subDivisions,
        });
      } catch (error: any) {
        adminLogs.error("Read sub-divisions failed", { error });
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
        tags: ["Sub-Division"],
        summary: "Read Sub-Division By Id",
        description: "Returns detailed information of a sub-division.",
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

        const subDivision = await fastify.prisma.subDivision.findFirst({
          where: {
            id,
            division: {
              section: {
                department: {
                  branch: {
                    companyId,
                  },
                },
              },
            },
            deletedAt: null,
          },
          include: {
            division: true,
          },
        });

        if (!subDivision) {
          return reply.status(404).send({
            success: false,
            message: "Sub-Division not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Sub-Division details fetched successfully.",
          data: subDivision,
        });
      } catch (error: any) {
        adminLogs.error("Read sub-division by id failed", { error });
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

export default readSubDivisionRoutes;
