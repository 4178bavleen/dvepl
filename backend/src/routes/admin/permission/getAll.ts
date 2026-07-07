import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function getAllPermissionsRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Permission"],
        summary: "Get All Permissions",
        description: "Returns all permission groups with permissions.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["role.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const groups = await fastify.prisma.permissionGroup.findMany({
          include: {
            permissions: {
              orderBy: {
                code: "asc",
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });

        return reply.status(200).send({
          success: true,
          data: groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            permissions: group.permissions.map((permission) => ({
              id: permission.id,
              code: permission.code,
              description: permission.description,
            })),
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

export default getAllPermissionsRoute;