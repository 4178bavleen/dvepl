import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

interface Params {
  id: string;
}

async function getDepartmentByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Department"],
        summary: "Get Department By ID",
        description: "Fetch department details by ID",
      },
    },

    async (
      request: FastifyRequest<{
        Params: Params;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const department = await fastify.prisma.department.findFirst({
          where: {
            id,
            deletedAt: null,
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
                isActive: true,
              },
            },
            employees: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            costCenters: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            _count: {
              select: {
                teams: true,
                employees: true,
                costCenters: true,
              },
            },
          },
        });

        if (!department) {
          return reply.status(404).send({
            success: false,
            message: "Department not found.",
          });
        }

        adminLogs.info("Department fetched successfully", {
          departmentId: department.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Department fetched successfully.",
          data: department,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch department", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching department.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default getDepartmentByIdRoutes;