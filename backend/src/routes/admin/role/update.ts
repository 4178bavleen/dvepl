import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateRoleSchema } from "../../../schemas/admin/role/role.schema";

async function updateRoleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Role"],
        summary: "Update Role",
        description: "Update role details and permissions.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["role.update"]),
      ],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------

        const validation = updateRoleSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const { id } = request.params;

        const { name, description, permissionIds } = validation.data;

        const companyId = request.user?.companyId;

        //--------------------------------
        // Check Role
        //--------------------------------

        const role = await fastify.prisma.role.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
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
            message: "System roles cannot be updated.",
          });
        }

        //--------------------------------
        // Duplicate Name
        //--------------------------------

        const existingRole = await fastify.prisma.role.findFirst({
          where: {
            companyId,
            name,
            NOT: {
              id,
            },
            deletedAt: null,
          },
        });

        if (existingRole) {
          return reply.status(409).send({
            success: false,
            message: "Role name already exists.",
          });
        }

        //--------------------------------
        // Validate Permissions
        //--------------------------------

        const permissions = await fastify.prisma.permission.findMany({
          where: {
            id: {
              in: permissionIds,
            },
          },
        });

        if (permissions.length !== permissionIds.length) {
          return reply.status(400).send({
            success: false,
            message: "One or more permissions are invalid.",
          });
        }

        //--------------------------------
        // Transaction
        //--------------------------------

        await fastify.prisma.$transaction(async (tx) => {
          await tx.role.update({
            where: {
              id,
            },
            data: {
              name,
              description,
            },
          });

          await tx.rolePermission.deleteMany({
            where: {
              roleId: id,
            },
          });

          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        });

        return reply.status(200).send({
          success: true,
          message: "Role updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Update Role Failed", { error });

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

export default updateRoleRoute;