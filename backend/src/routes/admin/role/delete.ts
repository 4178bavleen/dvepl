import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteRoleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Role"],
        summary: "Delete Role",
        description: "Soft delete role.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["role.delete"]),
      ],
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params as { id: string };

        const companyId = (request.user as any)?.companyId;

        //--------------------------------
        // Check Role
        //--------------------------------

        const role = await fastify.prisma.role.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
          include: {
            userRoles: true,
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            message: "Role not found.",
          });
        }

        if (role.isSystem) {
          return reply.status(400).send({
            success: false,
            message: "System roles cannot be deleted.",
          });
        }

        //--------------------------------
        // Check Users
        //--------------------------------

        if (role.userRoles.length > 0) {
          return reply.status(400).send({
            success: false,
            message: "Role is assigned to users and cannot be deleted.",
          });
        }

        //--------------------------------
        // Soft Delete
        //--------------------------------

        await fastify.prisma.role.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Role deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Role Failed", { error });

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

export default deleteRoleRoute;