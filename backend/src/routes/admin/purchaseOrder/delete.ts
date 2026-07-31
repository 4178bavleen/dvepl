import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function adminPurchaseOrderDeleteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Delete Purchase Order",
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        const companyId = request.user.companyId;

        const purchaseOrder =
          await fastify.prisma.purchaseOrder.findFirst({
            where: {
              id,
              companyId,
              deletedAt: null,
            },
          });

        if (!purchaseOrder) {
          return reply.status(404).send({
            success: false,
            message: "Purchase Order not found.",
          });
        }

        await fastify.prisma.purchaseOrder.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        adminLogs.info("Purchase Order deleted", {
          poId: id,
          deletedBy: request.user.id,
        });

        return reply.send({
          success: true,
          message: "Purchase Order deleted successfully.",
        });
      } catch (error: any) {
        console.log(error);

        adminLogs.error("Purchase Order delete failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting Purchase Order.",
          error: error.message,
        });
      }
    },
  );
}

export default adminPurchaseOrderDeleteRoutes;