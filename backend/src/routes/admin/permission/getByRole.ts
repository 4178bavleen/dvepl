import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface GetPermissionsByRoleParams {
  roleId: string;
}

async function getPermissionsByRoleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get<{ Params: GetPermissionsByRoleParams }>(
    "/:roleId",
    {
      schema: {
        tags: ["Permission"],
        summary: "Get Permissions By Role",
        description:
          "Returns all permission groups with permissions, each flagged as assigned/unassigned for the given role.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["role.view"]),
      ],
    },
    async (request: FastifyRequest<{ Params: GetPermissionsByRoleParams }>, reply: FastifyReply) => {
      const { roleId } = request.params;

      try {
        const role = await fastify.prisma.role.findFirst({
          where: {
            id: roleId,
            companyId: request.admin!.companyId,
            deletedAt: null,
          },
          include: {
            rolePermissions: {
              select: { permissionId: true },
            },
          },
        });

        if (!role) {
          return reply.status(404).send({
            success: false,
            message: "Role not found",
          });
        }

        const assignedIds = new Set(
          role.rolePermissions.map((rp) => rp.permissionId)
        );

        const groups = await fastify.prisma.permissionGroup.findMany({
          include: {
            permissions: {
              orderBy: { code: "asc" },
            },
          },
          orderBy: { name: "asc" },
        });

        return reply.status(200).send({
          success: true,
          data: {
            roleId: role.id,
            roleName: role.name,
            groups: groups.map((group) => ({
              id: group.id,
              name: group.name,
              description: group.description,
              permissions: group.permissions.map((permission) => ({
                id: permission.id,
                code: permission.code,
                description: permission.description,
                assigned: assignedIds.has(permission.id),
              })),
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

export default getPermissionsByRoleRoute;