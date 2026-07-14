import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readTeamRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Team"],
        summary: "Get Teams",
        description: "Fetch all teams for the company.",
        querystring: {
          type: "object",
          properties: {
            departmentId: { type: "string" },
          },
        },
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
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

        const { departmentId } = request.query as { departmentId?: string };

        const teams = await fastify.prisma.team.findMany({
          where: {
            deletedAt: null,
            department: {
              branch: {
                companyId,
              },
              ...(departmentId ? { id: departmentId } : {}),
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
            _count: {
              select: {
                employees: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        adminLogs.info("Teams fetched successfully", {
          count: teams.length,
        });

        return reply.status(200).send({
          success: true,
          message: "Teams fetched successfully.",
          data: teams,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch teams", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching teams.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readTeamRoutes;
