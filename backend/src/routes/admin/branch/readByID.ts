import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

interface Params {
  id: string;
}

async function readBranchByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Branch"],
        summary: "Get Branch By ID",
        description: "Fetch branch details by ID",
      },
    },

    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const branch = await fastify.prisma.branch.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            departments: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        });

        if (!branch) {
          return reply.status(404).send({
            success: false,
            message: "Branch not found.",
          });
        }

        adminLogs.info("Branch fetched successfully", {
          branchId: branch.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Branch fetched successfully.",
          data: branch,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch branch", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching branch.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readBranchByIdRoutes;