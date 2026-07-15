import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface RevokePermissionParams {
  roleId: string;
  permissionId: string;
}

async function revokePermissionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete<{ Params: RevokePermissionParams }>(
    "/:roleId/revoke/:permissionId",
    {
      schema: {
        tags: ["Permission"],
        summary: "Revoke Permission From Role",
        description:
          "Removes a single permission from a role, leaving its other permissions untouched.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["role.update"]),
      ],
    },
    async (
      request: FastifyRequest<{ Params: RevokePermissionParams }>,
      reply: FastifyReply
    ) => {
      const { roleId, permissionId } = request.params;

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

        await fastify.prisma.rolePermission.deleteMany({
          where: { roleId, permissionId },
        });

        return reply.status(200).send({
          success: true,
          message: "Permission revoked successfully",
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

export default revokePermissionRoute;