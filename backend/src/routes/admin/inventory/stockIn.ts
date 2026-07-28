import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  Prisma,
  InventoryTransactionType,
} from "@prisma/client";

import { adminLogs } from "../../../services/logger/contextLogger";
import { inventoryStockInSchema } from "../../../schemas/admin/inventory/inventory.schema";

async function adminInventoryStockInRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Stock In",
        description: "Add stock into inventory",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ==========================
        // Validate Request
        // ==========================

        const validationResult = inventoryStockInSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid Stock In data.",
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

        // ==========================
        // Transaction
        // ==========================

        const result = await fastify.prisma.$transaction(async (tx) => {
          const stockBefore = inventory.quantity;

          const stockAfter = new Prisma.Decimal(
            Number(stockBefore) + Number(quantity),
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

          // Create Movement

          const transaction = await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,

              transactionType:
                InventoryTransactionType.STOCK_IN,

              quantity: new Prisma.Decimal(quantity),

              stockBefore,

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
              warehouse: true,
              bin: true,
            },
          });

        adminLogs.info("Stock In completed", {
          inventoryId,
          quantity,
          updatedBy: request.user.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Stock added successfully.",
          data: {
            inventory: updatedInventory,
            transaction: result.transaction,
          },
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Stock In failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error during stock in.",
          error: error.message,
        });
      }
    },
  );
}

export default adminInventoryStockInRoutes;