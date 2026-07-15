import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function resetUserAccessRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete<{
    Params: { id: string };
  }>(
    "/:id",
    {
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.update"]),
      ],
      schema: {
        tags: ["Access"],
        summary: "Reset User Access Overrides",
        description: "Deletes all custom permission overrides for a user, resetting their access to role defaults.",
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company missing.",
          });
        }

        const { id } = request.params;

        const user = await fastify.prisma.user.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!user) {
          return reply.status(404).send({
            success: false,
            message: "User not found.",
          });
        }

        await fastify.prisma.userPermission.deleteMany({
          where: {
            userId: id,
          },
        });

        adminLogs.info("User access overrides reset", { userId: id });

        return reply.send({
          success: true,
          message: "User permission overrides reset successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Failed to reset user access", { error });
        return reply.status(500).send({
          success: false,
          message: error.message,
        });
      }
    }
  );
}

export default resetUserAccessRoute;
