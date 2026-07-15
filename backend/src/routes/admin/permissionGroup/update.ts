import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updatePermissionGroupSchema } from "../../../schemas/admin/permissionGroup/permissionGroup";

async function updatePermissionGroupRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put<{
    Params: { id: string };
  }>(
    "/:id",
    {
      schema: {
        tags: ["Permission Group"],
        summary: "Update Permission Group",
        description: "Update details of a permission group",
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const validationResult = updatePermissionGroupSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid permission group data for update", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid permission group data.",
            error: validationResult.error.issues,
          });
        }

        const { name, description } = validationResult.data;

        // Check if group exists
        const existingGroup = await fastify.prisma.permissionGroup.findUnique({
          where: { id },
        });

        if (!existingGroup) {
          return reply.status(404).send({
            success: false,
            message: "Permission group not found.",
          });
        }

        // Check duplicate group name if name is updated
        if (name && name !== existingGroup.name) {
          const duplicateName = await fastify.prisma.permissionGroup.findUnique({
            where: { name },
          });

          if (duplicateName) {
            return reply.status(409).send({
              success: false,
              message: "Permission group name already exists.",
            });
          }
        }

        const updatedPermissionGroup = await fastify.prisma.permissionGroup.update({
          where: { id },
          data: {
            name,
            description,
          },
        });

        adminLogs.info("Permission group updated", {
          permissionGroupId: updatedPermissionGroup.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Permission group updated successfully.",
          data: updatedPermissionGroup,
        });
      } catch (error: any) {
        adminLogs.error("Permission group update failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating permission group.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updatePermissionGroupRoutes;
