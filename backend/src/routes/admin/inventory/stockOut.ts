import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  Prisma,
  TransactionType,
} from "@prisma/client";

import { adminLogs } from "../../../services/logger/contextLogger";
import { inventoryStockOutSchema } from "../../../schemas/admin/inventory/inventory.schema";

async function adminInventoryStockOutRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Stock Out",
        description: "Remove stock from inventory",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ==========================
        // Validate Request
        // ==========================

        const validationResult =
          inventoryStockOutSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid Stock Out data.",
            error: validationResult.error.issues,
          });
        }

        const {
          inventoryId,
          quantity,
          referenceType,
          referenceId,
          remarks,
        } = validationResult.data;

        const companyId = request.user.companyId;

        // ==========================
        // Inventory Validation
        // ==========================

        const inventory = await fastify.prisma.inventory.findFirst({
          where: {
            id: inventoryId,
            companyId,
            deletedAt: null,
          },
        });

        if (!inventory) {
          return reply.status(404).send({
            success: false,
            message: "Inventory item not found.",
          });
        }

        const stockBefore = Number(inventory.quantity);
        const stockOutQty = Number(quantity);

        if (stockOutQty <= 0) {
          return reply.status(400).send({
            success: false,
            message: "Quantity must be greater than zero.",
          });
        }

        if (stockBefore < stockOutQty) {
          return reply.status(400).send({
            success: false,
            message: "Insufficient stock available.",
            data: {
              availableStock: stockBefore,
            },
          });
        }

        // ==========================
        // Transaction
        // ==========================

        const result = await fastify.prisma.$transaction(async (tx) => {
          const stockAfter = new Prisma.Decimal(
            stockBefore - stockOutQty,
          );

          // Update Inventory

          const updatedInventory = await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              quantity: stockAfter,
            },
          });

          // Create Inventory Transaction

          const transaction =
            await tx.inventoryTransaction.create({
              data: {
                inventoryId: inventory.id,

                transactionType:
                  TransactionType.STOCK_OUT,

                quantity: new Prisma.Decimal(quantity),

                stockBefore: inventory.quantity,

                stockAfter,

                referenceType,

                referenceId,

                remarks: remarks ?? null,

                createdById: request.user.id,
              },
            });

          return {
            inventory: updatedInventory,
            transaction,
          };
        });

        // ==========================
        // Fetch Updated Inventory
        // ==========================

        const updatedInventory =
          await fastify.prisma.inventory.findUnique({
            where: {
              id: result.inventory.id,
            },
            include: {
              material: {
                include: {
                  preferredVendor: true,
                },
              },
              
              bin: true,
            },
          });

        adminLogs.info("Stock Out completed", {
          inventoryId,
          quantity,
          updatedBy: request.user.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Stock removed successfully.",
          data: {
            inventory: updatedInventory,
            transaction: result.transaction,
          },
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Stock Out failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error during stock out.",
          error: error.message,
        });
      }
    },
  );
}

export default adminInventoryStockOutRoutes;