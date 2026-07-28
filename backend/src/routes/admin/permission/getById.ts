import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  userId: string;
}

async function getUserPermissionsRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get<{
    Params: Params;
  }>(
    "/:userId/permissions",
    {
      schema: {
        tags: ["User"],
        summary: "Get User Permissions",
        description: "Returns permissions assigned to a user.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.view"]),
      ],
    },
    async (
      request: FastifyRequest<{
        Params: Params;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.params;
        const companyId = request.admin!.companyId;

        // Verify user belongs to current company
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

        const permissions = await fastify.prisma.userPermission.findMany({
          where: {
            userId,
          },
          include: {
            permission: {
              include: {
                group: true,
              },
            },
          },
          orderBy: {
            permission: {
              code: "asc",
            },
          },
        });

        return reply.send({
          success: true,
          data: permissions.map((item) => ({
            id: item.permission.id,
            code: item.permission.code,
            description: item.permission.description,
            group: item.permission.group?.name ?? null,
            allowed: item.allowed,
          })),
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

export default getUserPermissionsRoute;