import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";
import { z } from "zod";

const receiveSchema = z.object({
  purchaseOrderItemId: z.string().uuid(),
  inventoryId: z.string().uuid(),
  receivedQty: z.coerce.number().positive(),
  remarks: z.string().optional().nullable(),
});

export default async function (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = receiveSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid data",
            errors: validation.error.issues,
          });
        }

        const {
          purchaseOrderItemId,
          inventoryId,
          receivedQty,
          remarks,
        } = validation.data;

        const companyId = request.user.companyId;

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
            message: "Inventory not found",
          });
        }

        const poItem =
          await fastify.prisma.purchaseOrderItem.findUnique({
            where: {
              id: purchaseOrderItemId,
            },
            include: {
              po: true,
            },
          });

        if (!poItem) {
          return reply.status(404).send({
            success: false,
            message: "PO Item not found",
          });
        }

        await fastify.prisma.$transaction(async (tx) => {
          // Inventory Update

          const stockAfter =
            Number(inventory.quantity) + Number(receivedQty);

          await tx.inventory.update({
            where: {
              id: inventory.id,
            },
            data: {
              quantity: new Prisma.Decimal(stockAfter),
            },
          });

          // Inventory Transaction

          await tx.inventoryTransaction.create({
            data: {
              inventoryId,

              transactionType: "IN",

              quantity: new Prisma.Decimal(receivedQty),

              stockBefore: inventory.quantity,

              stockAfter: new Prisma.Decimal(stockAfter),

              referenceType: "PURCHASE_ORDER",

              referenceId: poItem.poId,

              remarks,
              createdById: request.user.id,
            },
          });

          // PO Update

          const totalReceived =
            Number(poItem.receivedQty) + Number(receivedQty);

          let status: any = "PARTIAL";

          if (totalReceived === 0) {
            status = "PENDING";
          } else if (totalReceived >= Number(poItem.quantity)) {
            status = "RECEIVED";
          }

          const expected =
            poItem.expectedDelivery ??
            poItem.po.expectedDelivery;

          if (
            expected &&
            new Date() > expected &&
            totalReceived < Number(poItem.quantity)
          ) {
            status = "OVERDUE";
          }

          await tx.purchaseOrderItem.update({
            where: {
              id: poItem.id,
            },
            data: {
              receivedQty: new Prisma.Decimal(totalReceived),

              trackingStatus: status,

              lastReceivedAt: new Date(),

              trackingRemarks: remarks,
            },
          });
        });

        return reply.send({
          success: true,
          message: "Material received successfully",
        });
      } catch (error: any) {
        console.log(error);

        return reply.status(500).send({
          success: false,
          message: error.message,
        });
      }
    },
  );
}