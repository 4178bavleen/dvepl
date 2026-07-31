import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";

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
        Body: any;
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
          status,
          items,
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

        await fastify.prisma.$transaction(async (tx) => {
          await tx.purchaseOrder.update({
            where: { id },
            data: {
              vendorId,
              paymentTerms,
              shippingTerms,
              remarks,
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
              await tx.purchaseOrderItem.create({
                data: {
                  poId: id,
                  materialId: item.materialId,
                  quantity: new Prisma.Decimal(item.quantity),
                  unitPrice: new Prisma.Decimal(item.unitPrice),
                  totalPrice: new Prisma.Decimal(
                    Number(item.quantity) * Number(item.unitPrice),
                  ),
                },
              });
            }
          }
        });

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