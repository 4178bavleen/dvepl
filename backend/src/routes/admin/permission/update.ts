import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  userId: string;
}

interface PermissionItem {
  permissionId: string;
  allowed: boolean;
}

interface Body {
  permissions: PermissionItem[];
}

async function updateUserPermissionsRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put<{
    Params: Params;
    Body: Body;
  }>(
    "/:userId/permissions",
    {
      schema: {
        tags: ["User"],
        summary: "Update User Permissions",
        description: "Assign permissions to a user.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.update"]),
      ],
    },
    async (
      request: FastifyRequest<{
        Params: Params;
        Body: Body;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.params;
        const { permissions } = request.body;
        const companyId = request.admin!.companyId;

        // Check user exists
        const user = await fastify.prisma.user.findFirst({
          where: {
            id: userId,
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

        await fastify.prisma.$transaction(async (tx) => {
          // Remove existing permissions
          await tx.userPermission.deleteMany({
            where: {
              userId,
            },
          });

          // Insert selected permissions
          if (permissions.length > 0) {
            await tx.userPermission.createMany({
              data: permissions
                .filter((p) => p.allowed)
                .map((p) => ({
                  userId,
                  permissionId: p.permissionId,
                  allowed: true,
                })),
            });
          }
        });

        return reply.send({
          success: true,
          message: "User permissions updated successfully.",
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

export default updateUserPermissionsRoute;