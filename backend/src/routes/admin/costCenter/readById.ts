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

async function getCostCenterByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Cost Center"],
        summary: "Get Cost Center By ID",
        description: "Fetch cost center details by ID",
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const costCenter = await fastify.prisma.costCenter.findFirst({
          where: {
            id,
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
        });

        if (!costCenter) {
          return reply.status(404).send({
            success: false,
            message: "Cost center not found.",
          });
        }

        adminLogs.info("Cost Center fetched successfully", {
          costCenterId: costCenter.id,
          companyId,
        });

        return reply.status(200).send({
          success: true,
          message: "Cost center fetched successfully.",
          data: costCenter,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch cost center", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching cost center.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default getCostCenterByIdRoutes;
