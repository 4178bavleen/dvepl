import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

import { createPermissionGroupSchema } from "../../../schemas/admin/permission-group/permission-group";

async function createPermissionGroupRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Permission Group"],
        summary: "Create Permission Group",
        description: "Create a new permission group",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createPermissionGroupSchema.safeParse(
          request.body
        );

        if (!validationResult.success) {
          adminLogs.error("Invalid permission group data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid permission group data.",
            error: validationResult.error.issues,
          });
        }

        const { name, description } = validationResult.data;

        // Check duplicate group name
        const existingGroup =
          await fastify.prisma.permissionGroup.findUnique({
            where: {
              name,
            },
          });

        if (existingGroup) {
          return reply.status(409).send({
            success: false,
            message: "Permission group already exists.",
          });
        }

        const permissionGroup =
          await fastify.prisma.permissionGroup.create({
            data: {
              name,
              description,
            },
          });

        adminLogs.info("Permission group created", {
          permissionGroupId: permissionGroup.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Permission group created successfully.",
          data: permissionGroup,
        });
      } catch (error: any) {
        adminLogs.error("Permission group creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating permission group.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createPermissionGroupRoutes;