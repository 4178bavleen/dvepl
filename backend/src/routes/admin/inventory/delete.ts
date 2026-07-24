import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function adminInventoryDeleteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Delete Inventory Item",
        description: "Delete an Inventory record",
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;
        const companyId = request.user.companyId;

        const existing = await fastify.prisma.inventory.findFirst({
          where: { id, companyId },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,
            message: "Inventory item not found.",
          });
        }

        // NOTE: this deletes only the Inventory row (a specific
        // warehouse/bin stock record), not the Material master record —
        // the same Material could have other Inventory rows across
        // warehouses. If you want the Material deleted too when this was
        // its last Inventory row, add that check here.
        await fastify.prisma.inventory.delete({ where: { id } });

        adminLogs.info("Inventory Item deleted successfully", {
          inventoryId: id,
          deletedBy: (request as any).admin.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Inventory Item deleted successfully.",
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Inventory deletion failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting Inventory.",
          error: error.message,
          stack: error.stack,
        });
      }
    },
  );
}

export default adminInventoryDeleteRoutes;