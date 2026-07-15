import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readDepartmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Department"],
        summary: "Get Departments",
        description: "Fetch all departments",
        querystring: {
          type: "object",
          properties: {
            companyId: { type: "string" },
          },
        },
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = (request.query as any)?.companyId || (request.admin as any)?.companyId;

        const departments = await fastify.prisma.department.findMany({
          where: {
            deletedAt: null,
            ...(companyId ? { branch: { companyId } } : {}),
          },
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
                company: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            teams: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                employees: true,
                teams: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        adminLogs.info("Departments fetched successfully", {
          count: departments.length,
        });

        return reply.status(200).send({
          success: true,
          message: "Departments fetched successfully.",
          data: departments,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch departments", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching departments.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readDepartmentRoutes;