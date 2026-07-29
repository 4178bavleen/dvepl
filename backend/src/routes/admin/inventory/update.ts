import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { adminLogs } from "../../../services/logger/contextLogger";
import { inventoryUpdateSchema } from "../../../schemas/admin/inventory/inventory.schema";

// Partial update schema.
// NOTE: `materialCode` and `openingStock` are intentionally excluded —
// materialCode should be immutable once created, and openingStock is a
// one-time entry (ongoing quantity changes should go through a dedicated
// stock-movement endpoint, not a generic update, so stockBefore/stockAfter
// stays auditable).

async function adminInventoryUpdateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Update Inventory Item",
        description: "Update Material & Inventory details",
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;
        const companyId = request.user.companyId;

        // ==========================
        // Validate Request
        // ==========================

        const validationResult = inventoryUpdateSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid Inventory update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid Inventory data.",
            error: validationResult.error.issues,
          });
        }

        const data = validationResult.data;

        // =========================================
        // Existence Check
        // =========================================

        const existing = await fastify.prisma.inventory.findFirst({
          where: { id, companyId },
          include: { material: true },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,
            message: "Inventory item not found.",
          });
        }

        // =========================================
        // Category / Warehouse / Bin Validation
        // =========================================

        // if (data.warehouseId) {
        //   const warehouse = await fastify.prisma.warehouse.findUnique({
        //     where: { id: data.warehouseId },
        //   });

        //   if (!warehouse) {
        //     return reply.status(404).send({
        //       success: false,
        //       message: "Warehouse not found.",
        //     });
        //   }
        // }

        // if (data.binId) {
        //   const bin = await fastify.prisma.bin.findUnique({
        //     where: { id: data.binId },
        //   });

        //   if (!bin) {
        //     return reply.status(404).send({
        //       success: false,
        //       message: "Bin not found.",
        //     });
        //   }
        // }

        // =========================================
        // Transaction
        // =========================================

        const updated = await fastify.prisma.$transaction(async (tx) => {
          // Update Material master data
          await tx.material.update({
            where: {
              id: existing.materialId,
            },
            data: {
              name: data.name ?? undefined,

              type: data.type ?? undefined,

              category: data.category ?? undefined,

              unit: data.unit ?? undefined,

              hsnCode: data.hsnCode ?? undefined,

              gst:
                data.gstPercent !== undefined
                  ? new Prisma.Decimal(data.gstPercent)
                  : data.gst !== undefined
                    ? new Prisma.Decimal(data.gst)
                    : undefined,

              reorderLevel:
                data.reorderLevel !== undefined
                  ? new Prisma.Decimal(data.reorderLevel)
                  : undefined,

              reorderQty:
                data.reorderQty !== undefined
                  ? new Prisma.Decimal(data.reorderQty)
                  : undefined,

              description:
                data.notes !== undefined
                  ? data.notes
                  : data.description !== undefined
                    ? data.description
                    : undefined,

              preferredVendorId:
                data.preferredVendorId !== undefined
                  ? data.preferredVendorId
                  : undefined,
            },
          });

          // Update Inventory stock data
       const inv = await tx.inventory.update({
  where: {
    id,
  },
  data: {

    quantity:
      data.currentStock !== undefined
        ? new Prisma.Decimal(data.currentStock)
        : data.quantity !== undefined
          ? new Prisma.Decimal(data.quantity)
          : undefined,


    unitPrice:
      data.unitRate !== undefined
        ? new Prisma.Decimal(data.unitRate)
        : data.unitPrice !== undefined
          ? new Prisma.Decimal(data.unitPrice)
          : undefined,


    location:
      data.location !== undefined
        ? data.location
        : undefined,
  },
});

          return inv;
        });

        // =========================================
        // Fetch Updated Inventory
        // =========================================

        const result = await fastify.prisma.inventory.findUnique({
          where: {
            id: updated.id,
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

        adminLogs.info("Inventory Item updated successfully", {
          inventoryId: id,
          updatedBy: request.user.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Inventory Item updated successfully.",
          data: result,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Inventory update failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating Inventory.",
          error: error.message,
          stack: error.stack,
        });
      }
    },
  );
}

export default adminInventoryUpdateRoutes;
