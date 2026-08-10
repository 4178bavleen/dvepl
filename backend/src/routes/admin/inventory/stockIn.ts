
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma, TransactionType, PurchaseOrderItem } from "@prisma/client";

import { adminLogs } from "../../../services/logger/contextLogger";
import { inventoryStockInSchema } from "../../../schemas/admin/inventory/inventory.schema";
import { CustomFieldService } from "../../../services/customFieldService";

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
        // ============================================================
        // Validate Request
        // ============================================================

        const validationResult = inventoryStockInSchema.safeParse(
          request.body,
        );

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
          customFields,
        } = validationResult.data;

        const companyId = request.user.companyId;
        const userId = request.user.id;

        // ============================================================
        // Quantity Validation
        // ============================================================

        const stockInQuantity = new Prisma.Decimal(quantity);

        if (stockInQuantity.lte(0)) {
          return reply.status(400).send({
            success: false,
            message: "Stock In quantity must be greater than zero.",
          });
        }

        // ============================================================
        // Transaction
        // ============================================================

        const result = await fastify.prisma.$transaction(async (tx) => {
          // ==========================================================
          // Fetch Inventory Inside Transaction
          // ==========================================================

          const inventory = await tx.inventory.findFirst({
            where: {
              id: inventoryId,
              companyId,
              deletedAt: null,
            },
          });

          if (!inventory) {
            throw new Error("INVENTORY_NOT_FOUND");
          }

          // ==========================================================
          // Current Stock
          // ==========================================================

          const stockBefore = new Prisma.Decimal(inventory.quantity);

          const stockAfter = stockBefore.add(stockInQuantity);

          // ==========================================================
          // Purchase Order Validation
          // ==========================================================

          let poItem: PurchaseOrderItem | null = null;

          if (referenceType === "PURCHASE_ORDER_ITEM") {
            if (!referenceId) {
              throw new Error("PO_ITEM_REFERENCE_REQUIRED");
            }

            poItem = await tx.purchaseOrderItem.findUnique({
              where: {
                id: referenceId,
              },
            });

            if (!poItem) {
              throw new Error("PO_ITEM_NOT_FOUND");
            }

            // --------------------------------------------------------
            // Prevent receiving more than ordered quantity
            // --------------------------------------------------------

            const orderedQty = new Prisma.Decimal(poItem.quantity);
            const currentReceivedQty = new Prisma.Decimal(
              poItem.receivedQty,
            );

            const newReceivedQty = currentReceivedQty.add(
              stockInQuantity,
            );

            if (newReceivedQty.gt(orderedQty)) {
              throw new Error("PO_QUANTITY_EXCEEDED");
            }
          }

          // ==========================================================
          // Update Inventory
          // ==========================================================

          const updatedInventory = await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              quantity: stockAfter,
            },
          });

          // ==========================================================
          // Sync Dynamic Record Quantity
          // ==========================================================

          const dynamicRecord = await tx.dynamicRecord.findUnique({
            where: { id: inventory.id },
          });

          if (dynamicRecord) {
            const dynamicFields = await tx.dynamicField.findMany({
              where: { moduleId: dynamicRecord.moduleId },
            });

            const quantityFieldNames = dynamicFields
              .filter((field) => {
                const fieldName = field.fieldName.toLowerCase();
                const label = field.label.toLowerCase();
                return (
                  fieldName === "quantity" ||
                  fieldName === "currentstock" ||
                  fieldName.includes("qty") ||
                  fieldName.includes("quantity") ||
                  fieldName.includes("stock") ||
                  fieldName.includes("balance") ||
                  label.includes("qty") ||
                  label.includes("quantity") ||
                  label.includes("stock") ||
                  label.includes("balance")
                );
              })
              .map((field) => field.fieldName);

            if (quantityFieldNames.length > 0) {
              const currentValues =
                (dynamicRecord.values as Record<string, any>) || {};

              await tx.dynamicRecord.update({
                where: { id: dynamicRecord.id },
                data: {
                  values: quantityFieldNames.reduce((values, fieldName) => {
                    return {
                      ...values,
                      [fieldName]: Number(stockAfter.toString()),
                    };
                  }, currentValues),
                },
              });
            }
          }

          // ==========================================================
          // Create Inventory Transaction
          // ==========================================================

          const transaction = await tx.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,

              transactionType: TransactionType.IN,

              quantity: stockInQuantity,

              stockBefore,

              stockAfter,

              referenceType: referenceType ?? null,

              referenceId: referenceId ?? null,

              remarks: remarks ?? null,

              createdById: userId,
            },
          });

          // ==========================================================
          // Update Purchase Order Received Quantity
          // ==========================================================

          if (poItem) {
            const orderedQty = new Prisma.Decimal(poItem.quantity);

            const currentReceivedQty = new Prisma.Decimal(
              poItem.receivedQty,
            );

            const newReceivedQty = currentReceivedQty.add(
              stockInQuantity,
            );

            let trackingStatus:
              | "PENDING"
              | "PARTIAL"
              | "RECEIVED";

            if (newReceivedQty.eq(orderedQty)) {
              trackingStatus = "RECEIVED";
            } else if (newReceivedQty.gt(0)) {
              trackingStatus = "PARTIAL";
            } else {
              trackingStatus = "PENDING";
            }

            await tx.purchaseOrderItem.update({
              where: {
                id: poItem.id,
              },
              data: {
                receivedQty: newReceivedQty,

                lastReceivedAt: new Date(),

                trackingStatus,
              },
            });
          }

          // ==========================================================
          // Save Custom Fields
          // ==========================================================
          //
          // IMPORTANT:
          // CustomFieldService must support receiving the current
          // Prisma transaction client for this to be fully atomic.
          //
          // If your current saveValues() only accepts the Prisma
          // client, keep this outside the transaction temporarily.
          //
          // Recommended service signature:
          //
          // saveValues(module, recordId, values, tx)
          //
          // ==========================================================

          if (customFields) {
            const cfService = new CustomFieldService(fastify.prisma);

            await cfService.saveValues(
              "inventory",
              inventory.id,
              customFields,
            );
          }

          return {
            inventory: updatedInventory,
            transaction,
          };
        });

        // ============================================================
        // Fetch Final Inventory
        // ============================================================

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

        // ============================================================
        // Logging
        // ============================================================

        adminLogs.info("Stock In completed", {
          inventoryId,
          quantity,
          updatedBy: userId,
          referenceType,
          referenceId,
        });

        // ============================================================
        // Response
        // ============================================================

        return reply.status(200).send({
          success: true,
          message: "Stock added successfully.",
          data: {
            inventory: updatedInventory,
            transaction: result.transaction,
          },
        });
      } catch (error: unknown) {
        // ============================================================
        // Known Business Errors
        // ============================================================

        if (error instanceof Error) {
          switch (error.message) {
            case "INVENTORY_NOT_FOUND":
              return reply.status(404).send({
                success: false,
                message: "Inventory item not found.",
              });

            case "PO_ITEM_REFERENCE_REQUIRED":
              return reply.status(400).send({
                success: false,
                message:
                  "referenceId is required when referenceType is PURCHASE_ORDER_ITEM.",
              });

            case "PO_ITEM_NOT_FOUND":
              return reply.status(404).send({
                success: false,
                message: "Purchase Order Item not found.",
              });

            case "PO_QUANTITY_EXCEEDED":
              return reply.status(400).send({
                success: false,
                message:
                  "Stock In quantity exceeds the remaining Purchase Order quantity.",
              });
          }
        }

        // ============================================================
        // Unexpected Error
        // ============================================================

        console.error("Stock In failed:", error);

        adminLogs.error("Stock In failed", {
          error,
          inventoryId: request.body
            ? (request.body as Record<string, unknown>).inventoryId
            : undefined,
          userId: request.user.id,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error during stock in.",
        });
      }
    },
  );
}

export default adminInventoryStockInRoutes;

