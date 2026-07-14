import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readSectionRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all sections for company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Section"],
        summary: "Read Sections",
        description: "Returns all sections under the authenticated company.",
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

        const sections = await fastify.prisma.section.findMany({
          where: {
            department: {
              branch: {
                companyId,
              },
            },
            deletedAt: null,
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                branch: {
                  select: { id: true, name: true },
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
          message: "Sections fetched successfully.",
          data: sections,
        });
      } catch (error: any) {
        adminLogs.error("Read sections failed", { error });
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
        tags: ["Section"],
        summary: "Read Section By Id",
        description: "Returns detailed information of a section.",
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

        const section = await fastify.prisma.section.findFirst({
          where: {
            id,
            department: {
              branch: {
                companyId,
              },
            },
            deletedAt: null,
          },
          include: {
            department: true,
            divisions: {
              where: { deletedAt: null },
            },
          },
        });

        if (!section) {
          return reply.status(404).send({
            success: false,
            message: "Section not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Section details fetched successfully.",
          data: section,
        });
      } catch (error: any) {
        adminLogs.error("Read section by id failed", { error });
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

export default readSectionRoutes;
