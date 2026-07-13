import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function getPermissionGroupByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Permission Group"],
        summary: "Get Permission Group By ID",
        description: "Fetch a permission group by its ID",
      },
    },

    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const permissionGroup =
          await fastify.prisma.permissionGroup.findUnique({
            where: {
              id,
            },
            include: {
              permissions: {
                orderBy: {
                  code: "asc",
                },
              },
            },
          });

        if (!permissionGroup) {
          return reply.status(404).send({
            success: false,
            message: "Permission group not found.",
          });
        }

        adminLogs.info("Permission group fetched", {
          permissionGroupId: permissionGroup.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Permission group fetched successfully.",
          data: permissionGroup,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch permission group", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching permission group.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default getPermissionGroupByIdRoutes;