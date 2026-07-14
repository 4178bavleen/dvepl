import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface UpdateRolePermissionsParams {
  roleId: string;
}

interface UpdateRolePermissionsBody {
  permissionIds: string[];
}

async function updateRolePermissionsRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put<{
    Params: UpdateRolePermissionsParams;
    Body: UpdateRolePermissionsBody;
  }>(
    "/:roleId",
    {
      schema: {
        tags: ["Permission"],
        summary: "Update Role Permissions",
        description:
          "Replaces a role's entire permission set with the provided list of permission IDs (full sync — anything not included is removed).",
        body: {
          type: "object",
          required: ["permissionIds"],
          properties: {
            permissionIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["role.update"]),
      ],
    },
    async (
      request: FastifyRequest<{
        Params: UpdateRolePermissionsParams;
        Body: UpdateRolePermissionsBody;
      }>,
      reply: FastifyReply
    ) => {
      const { roleId } = request.params;
      const { permissionIds } = request.body;

      try {
        const role = await fastify.prisma.role.findFirst({
          where: {
            id: roleId,
            companyId: request.admin!.companyId,
            deletedAt: null,
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            message: "Role not found",
          });
        }

        if (role.isSystem) {
          return reply.status(403).send({
            success: false,
            message: "Permissions for a system role cannot be modified",
          });
        }

        const uniqueIds = [...new Set(permissionIds)];

        if (uniqueIds.length > 0) {
          const validCount = await fastify.prisma.permission.count({
            where: { id: { in: uniqueIds } },
          });

          if (validCount !== uniqueIds.length) {
            return reply.status(400).send({
              success: false,
              message: "One or more permission IDs are invalid",
            });
          }
        }

        await fastify.prisma.$transaction(async (tx) => {
          await tx.rolePermission.deleteMany({ where: { roleId } });

          if (uniqueIds.length > 0) {
            await tx.rolePermission.createMany({
              data: uniqueIds.map((permissionId) => ({
                roleId,
                permissionId,
              })),
              skipDuplicates: true,
            });
          }
        });

        await fastify.prisma.auditLog.create({
          data: {
            userId: request.admin!.id,
            module: "Role",
            recordId: roleId,
            action: "UPDATE_PERMISSIONS",
            newValue: { permissionIds: uniqueIds },
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        const updated = await fastify.prisma.role.findUnique({
          where: { id: roleId },
          include: {
            rolePermissions: { include: { permission: true } },
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Role permissions updated successfully",
          data: {
            roleId: updated!.id,
            permissions: updated!.rolePermissions.map((rp) => ({
              id: rp.permission.id,
              code: rp.permission.code,
            })),
          },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          message: "Server Error",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updateRolePermissionsRoute;