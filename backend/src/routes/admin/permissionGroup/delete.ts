import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deletePermissionGroupRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete<{
    Params: { id: string };
  }>(
    "/:id",
    {
      schema: {
        tags: ["Permission Group"],
        summary: "Delete Permission Group",
        description: "Delete a permission group by ID. Fails if permissions are still linked.",
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        // Check if group exists
        const existingGroup = await fastify.prisma.permissionGroup.findUnique({
          where: { id },
          include: {
            permissions: true,
          },
        });

        if (!existingGroup) {
          return reply.status(404).send({
            success: false,
            message: "Permission group not found.",
          });
        }

        // Fails if permissions are still linked
        if (existingGroup.permissions.length > 0) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete permission group because it contains active permissions.",
          });
        }

        await fastify.prisma.permissionGroup.delete({
          where: { id },
        });

        adminLogs.info("Permission group deleted", {
          permissionGroupId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Permission group deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Permission group deletion failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting permission group.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default deletePermissionGroupRoutes;
