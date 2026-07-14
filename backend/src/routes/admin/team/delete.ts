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

async function deleteTeamRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Team"],
        summary: "Delete Team",
        description: "Soft delete a team.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params as Params;
        const companyId = request.user?.companyId;

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
            employees: {
              where: {
                deletedAt: null,
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

        // Prevent deletion if team is being used by active employees
        if (team.employees.length > 0) {
          return reply.status(409).send({
            success: false,
            message: "Team cannot be deleted because it has active employees assigned to it.",
          });
        }

        await fastify.prisma.team.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        adminLogs.info("Team soft-deleted successfully", {
          teamId: id,
          deletedBy: request.user?.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Team deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Team deletion failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting team.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default deleteTeamRoutes;
