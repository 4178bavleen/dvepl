import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminInventoryTransactionReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // List all inventory transactions for the company
  fastify.get(
    "/read",
    {
      schema: {
        tags: ["Inventory"],
        summary: "List Stock Movements",
        description: "Get all stock movement logs / ledger for the company",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;

        const transactions = await fastify.prisma.inventoryTransaction.findMany({
          where: {
            inventory: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            createdBy: true,
            inventory: {
              include: {
                material: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Load custom fields values for inventory items
        const { CustomFieldService } = await import("../../../services/customFieldService");
        const cfService = new CustomFieldService(fastify.prisma);
        const inventoryIds = Array.from(new Set(transactions.map((t) => t.inventoryId)));
        const cfValuesMap = await cfService.getValuesForEntities("inventory", inventoryIds);

        const mapped = transactions.map((t) => {
          const cf = cfValuesMap[t.inventoryId] || {};
          
          // Fallbacks for standard fields stored in reference fields
          const rate = 0;
          const vendorName = "";
          const poNumber = (t.referenceType === "PURCHASE_ORDER" ? t.referenceId : "");
          const invoiceNo = (t.referenceType === "INVOICE" ? t.referenceId : "");
          const orderCode = (t.referenceType === "SALES_ORDER" ? t.referenceId : "");

          return {
            id: t.id,
            inventoryItemId: t.inventoryId,
            item: {
              name: t.inventory.material.name,
              type: t.inventory.material.type.toLowerCase(),
            },
            type: t.transactionType,
            quantity: Number(t.quantity),
            stockBefore: Number(t.stockBefore),
            stockAfter: Number(t.stockAfter),
            referenceType: t.referenceType,
            referenceId: t.referenceId,
            remarks: t.remarks,
            createdBy: {
              name: t.createdBy.name,
            },
            createdAt: t.createdAt.toISOString(),
            rate,
            vendorName,
            poNumber,
            invoiceNo,
            orderCode,
            customFields: cf,
          };
        });

        return reply.status(200).send({
          success: true,
          message: "Stock movements fetched successfully.",
          data: mapped,
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Failed to fetch stock movements", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error while fetching stock movements.",
          error: error.message,
        });
      }
    },
  );
}

export default adminInventoryTransactionReadRoutes;
