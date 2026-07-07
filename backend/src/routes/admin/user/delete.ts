import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteUserRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["User"],
        summary: "Delete User",
        description: "Soft delete a user.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.delete"]),
      ],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const companyId = request.user?.companyId;
        const loggedInUserId = request.user?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params;

        // Prevent self deletion
        if (id === loggedInUserId) {
          return reply.status(400).send({
            success: false,
            message: "You cannot delete your own account.",
          });
        }

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

        await fastify.prisma.user.update({
          where: {
            id,
          },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });

        return reply.status(200).send({
          success: true,
          message: "User deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete User Failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default deleteUserRoute;