import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface AssignPermissionParams {
  roleId: string;
}

interface AssignPermissionBody {
  permissionId: string;
}

async function assignPermissionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post<{
    Params: AssignPermissionParams;
    Body: AssignPermissionBody;
  }>(
    "/:roleId/assign",
    {
      schema: {
        tags: ["Permission"],
        summary: "Assign Permission To Role",
        description:
          "Grants a single permission to a role, leaving its other permissions untouched.",
        body: {
          type: "object",
          required: ["permissionId"],
          properties: {
            permissionId: { type: "string" },
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
        Params: AssignPermissionParams;
        Body: AssignPermissionBody;
      }>,
      reply: FastifyReply
    ) => {
      const { roleId } = request.params;
      const { permissionId } = request.body;

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

        const permission = await fastify.prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          return reply.status(400).send({
            success: false,
            message: "Invalid permission ID",
          });
        }

        const rolePermission = await fastify.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
          update: {},
          create: { roleId, permissionId },
        });

        return reply.status(200).send({
          success: true,
          message: "Permission assigned successfully",
          data: rolePermission,
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

export default assignPermissionRoute;