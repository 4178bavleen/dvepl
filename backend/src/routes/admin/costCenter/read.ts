import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readCostCenterRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Cost Center"],
        summary: "Get Cost Centers",
        description: "Fetch all active cost centers for the company",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const costCenters = await fastify.prisma.costCenter.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        adminLogs.info("Cost Centers fetched successfully", {
          companyId,
          count: costCenters.length,
        });

        return reply.status(200).send({
          success: true,
          message: "Cost centers fetched successfully.",
          data: costCenters,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch cost centers", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching cost centers.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readCostCenterRoutes;
