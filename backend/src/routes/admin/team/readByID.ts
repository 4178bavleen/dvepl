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

async function getTeamByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Team"],
        summary: "Get Team By ID",
        description: "Fetch team details by ID.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params as Params;
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const team = await fastify.prisma.team.findFirst({
          where: {
            id,
            deletedAt: null,
            department: {
              branch: {
                companyId,
              },
            },
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
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
            _count: {
              select: {
                employees: true,
              },
            },
          },
        });

        if (!team) {
          return reply.status(404).send({
            success: false,
            message: "Team not found.",
          });
        }

        adminLogs.info("Team fetched successfully", {
          teamId: team.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Team fetched successfully.",
          data: team,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch team", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching team.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default getTeamByIdRoutes;
