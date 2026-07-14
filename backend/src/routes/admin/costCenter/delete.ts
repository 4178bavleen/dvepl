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

async function deleteCostCenterRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Cost Center"],
        summary: "Delete Cost Center",
        description: "Soft delete a cost center",
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
        });

        if (!costCenter) {
          return reply.status(404).send({
            success: false,
            message: "Cost center not found.",
          });
        }

        await fastify.prisma.costCenter.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        adminLogs.info("Cost Center deleted successfully", {
          costCenterId: id,
          companyId,
        });

        return reply.status(200).send({
          success: true,
          message: "Cost center deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Cost center deletion failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting cost center.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default deleteCostCenterRoutes;
