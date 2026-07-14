import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readDesignationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Designation"],
        summary: "Get Designations",
        description: "Fetch all designations",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const designations = await fastify.prisma.designation.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                employees: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        adminLogs.info("Designations fetched successfully", {
          count: designations.length,
        });

        return reply.status(200).send({
          success: true,
          message: "Designations fetched successfully.",
          data: designations,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch designations", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching designations.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readDesignationRoutes;
