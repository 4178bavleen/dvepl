import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma, PurchaseOrderStatus, TransactionType } from "@prisma/client";

import { goodsReceiptSchema } from "../../../schemas/admin/goodsRecipt/goodsRecipt.schema";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminGoodsReceiptCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Goods Receipt"],
        summary: "Create Goods Receipt",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = goodsReceiptSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid Goods Receipt.",
            error: validationResult.error.issues,
          });
        }

        const {
          poId,
          grnNo,
          invoiceNo,
          invoiceDate,
          remarks,
          items,
        } = validationResult.data;

        const companyId = request.user.companyId;

        const purchaseOrder =
          await fastify.prisma.purchaseOrder.findFirst({
            where: {
              id: poId,
              companyId,
              deletedAt: null,
            },
            include: {
              items: true,
            },
          });

        if (!purchaseOrder) {
          return reply.status(404).send({
            success: false,
            message: "Purchase Order not found.",
          });
        }

        const result = await fastify.prisma.$transaction(async (tx) => {
          const grn = await tx.goodsReceipt.create({
            data: {
              companyId,
              poId,
              grnNo,
              invoiceNo: invoiceNo ?? null,
              invoiceDate: invoiceDate
                ? new Date(invoiceDate)
                : null,
              remarks: remarks ?? null,
              receivedById: request.user.id,
            },
          });

                  for (const item of items) {
            const totalPrice =
              Number(item.acceptedQty) *
              Number(item.unitPrice);

            await tx.goodsReceiptItem.create({
              data: {
                grnId: grn.id,
                poItemId: item.poItemId,
                materialId: item.materialId,

                quantity: new Prisma.Decimal(item.quantity),

                acceptedQty: new Prisma.Decimal(
                  item.acceptedQty,
                ),

                rejectedQty: new Prisma.Decimal(
                  item.rejectedQty,
                ),

                unitPrice: new Prisma.Decimal(
                  item.unitPrice,
                ),

                totalPrice: new Prisma.Decimal(totalPrice),

                batchNo: item.batchNo ?? null,

                serialNo: item.serialNo ?? null,

                expiryDate: item.expiryDate
                  ? new Date(item.expiryDate)
                  : null,

                remarks: item.remarks ?? null,
              },
            });

            const poItem =
              await tx.purchaseOrderItem.findUnique({
                where: {
                  id: item.poItemId,
                },
              });

            await tx.purchaseOrderItem.update({
              where: {
                id: item.poItemId,
              },
              data: {
                receivedQty: new Prisma.Decimal(
                  Number(poItem!.receivedQty) +
                    Number(item.acceptedQty),
                ),
              },
            });

            const inventory =
              await tx.inventory.findFirst({
                where: {
                  companyId,
                  materialId: item.materialId,
                  deletedAt: null,
                },
              });

            if (inventory) {
              const stockAfter =
                Number(inventory.quantity) +
                Number(item.acceptedQty);

              await tx.inventory.update({
                where: {
                  id: inventory.id,
                },
                data: {
                  quantity: new Prisma.Decimal(stockAfter),
                },
              });

              await tx.inventoryTransaction.create({
                data: {
                  inventoryId: inventory.id,

                  transactionType:
                    TransactionType.IN,

                  quantity: new Prisma.Decimal(
                    item.acceptedQty,
                  ),

                  stockBefore: inventory.quantity,

                  stockAfter: new Prisma.Decimal(
                    stockAfter,
                  ),

                  referenceType: "GOODS_RECEIPT",

                  referenceId: grn.id,

                  remarks: "Goods Receipt",

                  createdById: request.user.id,
                },
              });
            }
          }
                    const poItems =
            await tx.purchaseOrderItem.findMany({
              where: {
                poId,
              },
            });

          const completed = poItems.every(
            (i) =>
              Number(i.receivedQty) >=
              Number(i.quantity),
          );

          await tx.purchaseOrder.update({
            where: {
              id: poId,
            },
            data: {
              status: completed
                ? PurchaseOrderStatus.COMPLETED
                : PurchaseOrderStatus.PARTIAL_RECEIVED,
            },
          });

          return grn;
        });

        adminLogs.info("Goods Receipt Created", {
          grnId: result.id,
          createdBy: request.user.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Goods Receipt created successfully.",
          data: result,
        });
      } catch (error: any) {
        console.log(error);

        return reply.status(500).send({
          success: false,
          message: "Server error while creating Goods Receipt.",
          error: error.message,
        });
      }
    },
  );
}

export default adminGoodsReceiptCreateRoutes;