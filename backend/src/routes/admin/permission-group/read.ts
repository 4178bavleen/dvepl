import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readPermissionGroupRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Permission Group"],
        summary: "Get Permission Groups",
        description: "Get all permission groups",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const permissionGroups =
          await fastify.prisma.permissionGroup.findMany({
            include: {
              _count: {
                select: {
                  permissions: true,
                },
              },
            },
            orderBy: {
              name: "asc",
            },
          });

        const data = permissionGroups.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description,
          permissionsCount: group._count.permissions,
        }));

        adminLogs.info("Permission groups fetched", {
          count: data.length,
        });

        return reply.status(200).send({
          success: true,
          message: "Permission groups fetched successfully.",
          data,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch permission groups", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching permission groups.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readPermissionGroupRoutes;