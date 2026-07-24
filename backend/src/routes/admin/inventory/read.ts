import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function adminInventoryReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // List all inventory items for the company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "List Inventory Items",
        description: "Get all inventory items for the company",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;

        const items = await fastify.prisma.inventory.findMany({
          where: { companyId, deletedAt: null },
          include: {
            material: true,
            warehouse: true,
            bin: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.status(200).send({
          success: true,
          message: "Inventory items fetched successfully.",
          data: items,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Failed to fetch inventory items", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching inventory.",
          error: error.message,
          stack: error.stack,
        });
      }
    },
  );

  // Get a single inventory item by id
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Get Inventory Item",
        description: "Get a single inventory item by id",
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;
        const companyId = request.user.companyId;

        const item = await fastify.prisma.inventory.findFirst({
          where: { id, companyId },
          include: {
            material: true,
            warehouse: true,
            bin: true,
          },
        });

        if (!item) {
          return reply.status(404).send({
            success: false,
            message: "Inventory item not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Inventory item fetched successfully.",
          data: item,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Failed to fetch inventory item", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching inventory item.",
          error: error.message,
          stack: error.stack,
        });
      }
    },
  );
}

export default adminInventoryReadRoutes;
