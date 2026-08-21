import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma , PurchaseOrderStatus } from "@prisma/client";
import { syncSalesOrderWorkflowFromPo } from "../../../utils/workflowSync";
interface UpdatePurchaseOrderBody {
  vendorId?: string;
  expectedDelivery?: string | null;
  paymentTerms?: string;
  shippingTerms?: string;
  remarks?: string;
  referenceCode?: string | null;
  linkedSalesOrderId?: string | null;
  poType?: "JOB" | "STOCK";
  status?: PurchaseOrderStatus;
  poStatus?: string;
  items?: {
    materialId: string;
    quantity: number;
    unitPrice: number;
    remarks?: string;
  }[];
}

async function adminPurchaseOrderUpdateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Update Purchase Order",
      },
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdatePurchaseOrderBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        const companyId = request.user.companyId;

        const {
          vendorId,
          expectedDelivery,
          paymentTerms,
          shippingTerms,
          remarks,
          referenceCode,
          linkedSalesOrderId,
          poType,
          status,
          items,
          poStatus,
        } = request.body;

        const existing = await fastify.prisma.purchaseOrder.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,
            message: "Purchase Order not found.",
          });
        }

        let subtotal = 0;

        if (Array.isArray(items)) {
          for (const item of items) {
            subtotal += Number(item.quantity) * Number(item.unitPrice);
          }
        }

        const total = subtotal;

        const ensureMaterialExists = async (tx: any, materialId: string, companyId: string, userId: string) => {
          const material = await tx.material.findUnique({
            where: { id: materialId },
          });

          if (material) {
            return;
          }

          // If not found, try to sync from dynamic record
          const record = await tx.dynamicRecord.findUnique({
            where: { id: materialId },
            include: { module: true },
          });

          if (record && record.module?.moduleKey === "inventory") {
            const values = record.values as Record<string, any>;
            const fields = await tx.dynamicField.findMany({
              where: { moduleId: record.moduleId },
            });

            const nameField = fields.find(
              (f: any) =>
                f.label.toLowerCase().includes("name") ||
                f.label.toLowerCase().includes("desc")
            );
            const nameVal = nameField ? values[nameField.fieldName] : null;
            const name = String(nameVal || Object.values(values)[0] || "Unnamed Item");

            const codeField = fields.find((f: any) => f.label.toLowerCase().includes("code"));
            const codeVal = codeField ? String(values[codeField.fieldName] || "").trim() : "";
            const materialCode = codeVal || `MAT-${record.id.substring(0, 8)}`;

            const unitField = fields.find((f: any) => f.label.toLowerCase().includes("unit"));
            const unit = unitField ? String(values[unitField.fieldName] || "Nos") : "Nos";

            const qtyField = fields.find(
              (f: any) =>
                f.label.toLowerCase().includes("qty") ||
                f.label.toLowerCase().includes("quantity")
            );
            const quantity = qtyField ? (Number(values[qtyField.fieldName]) || 0) : 0;

            const priceField = fields.find(
              (f: any) =>
                f.label.toLowerCase().includes("price") ||
                f.label.toLowerCase().includes("rate")
            );
            const unitPrice = priceField ? (Number(values[priceField.fieldName]) || 0) : 0;

            const catField = fields.find(
              (f: any) =>
                f.label.toLowerCase().includes("category") ||
                f.label.toLowerCase().includes("group")
            );
            const category = catField ? String(values[catField.fieldName] || "General") : "General";

            // Upsert static Material
            await tx.material.upsert({
              where: { id: record.id },
              create: {
                id: record.id,
                companyId,
                name,
                materialCode,
                unit,
                gst: new Prisma.Decimal(18),
                category,
                createdById: userId,
              },
              update: {
                name,
                materialCode,
                unit,
                category,
              },
            });

            // Upsert static Inventory
            await tx.inventory.upsert({
              where: { id: record.id },
              create: {
                id: record.id,
                companyId,
                materialId: record.id,
                quantity: new Prisma.Decimal(quantity),
                unitPrice: new Prisma.Decimal(unitPrice),
              },
              update: {
                quantity: new Prisma.Decimal(quantity),
                unitPrice: new Prisma.Decimal(unitPrice),
              },
            });
            return;
          }

          // If neither exists, throw an error
          throw new Error(`Material with ID ${materialId} does not exist in the system.`);
        };

        await fastify.prisma.$transaction(async (tx) => {
          await tx.purchaseOrder.update({
            where: { id },
            data: {
              vendorId,
              paymentTerms,
              shippingTerms,
              remarks,
              referenceCode,
              ...(linkedSalesOrderId !== undefined ? { linkedSalesOrderId: linkedSalesOrderId || null } : {}),
              ...(poType ? { poType } : {}),
              status,
              expectedDelivery: expectedDelivery
                ? new Date(expectedDelivery)
                : null,
              subtotal: new Prisma.Decimal(subtotal),
              tax: new Prisma.Decimal(0),
              total: new Prisma.Decimal(total),
            },
          });

          if (Array.isArray(items)) {
            await tx.purchaseOrderItem.deleteMany({
              where: {
                poId: id,
              },
            });

            for (const item of items) {
              await ensureMaterialExists(tx, item.materialId, companyId, request.user.id);

              await tx.purchaseOrderItem.create({
                data: {
                  poId: id,
                  materialId: item.materialId,
                  quantity: new Prisma.Decimal(item.quantity),
                  unitPrice: new Prisma.Decimal(item.unitPrice),
                  totalPrice: new Prisma.Decimal(
                    Number(item.quantity) * Number(item.unitPrice),
                  ),
                  remarks: item.remarks,
                },
              });
            }
          }
        });

        // Sync with SalesOrder workflow stage — direct ID link first,
        // reference-code matching only as legacy fallback
        await syncSalesOrderWorkflowFromPo(
          fastify.prisma,
          referenceCode || existing.referenceCode,
          poStatus || status,
          request.user.id,
          linkedSalesOrderId !== undefined ? linkedSalesOrderId || null : existing.linkedSalesOrderId
        );

        const result = await fastify.prisma.purchaseOrder.findUnique({
          where: { id },
          include: {
            vendor: true,
            items: {
              include: {
                material: true,
              },
            },
          },
        });

        return reply.send({
          success: true,
          message: "Purchase Order updated successfully.",
          data: result,
        });
      } catch (error: any) {
        console.log(error);

        if (error.message && error.message.includes("does not exist in the system")) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }

        return reply.status(500).send({
          success: false,
          message: "Server error while updating Purchase Order.",
          error: error.message,
        });
      }
    },
  );
}

export default adminPurchaseOrderUpdateRoutes;
