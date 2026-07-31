import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { z } from "zod";

import { adminLogs } from "../../../services/logger/contextLogger";

const purchaseOrderSchema = z.object({
  poNo: z.string().min(1),

  vendorId: z.string().uuid(),

  orderDate: z.string(),

  expectedDelivery: z.string().optional().nullable(),

  paymentTerms: z.string().optional().nullable(),

  shippingTerms: z.string().optional().nullable(),

  remarks: z.string().optional().nullable(),

  items: z
    .array(
      z.object({
        materialId: z.string().uuid(),

        quantity: z.coerce.number().positive(),

        unitPrice: z.coerce.number().positive(),
      }),
    )
    .min(1),
});

async function adminPurchaseOrderCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Create Purchase Order",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
          console.log("BODY =>", request.body);
        const validation = purchaseOrderSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid Purchase Order",
            error: validation.error.issues,
          });
        }

        const {
          poNo,
          vendorId,
          orderDate,
          expectedDelivery,
          paymentTerms,
          shippingTerms,
          remarks,
          items,
        } = validation.data;

        const companyId = request.user.companyId;
        console.log(companyId);

        console.log("Vendor ID from payload:", vendorId);
        console.log("User Company ID:", companyId);

        const vendor = await fastify.prisma.customer.findFirst({
          where: {
            id: vendorId,
            companyId,
            deletedAt: null,
          },
        });

        console.log("Vendor Found:", vendor);

        if (!vendor) {
          return reply.status(404).send({
            success: false,
            message: "Vendor not found.",
          });
        }

        const existing = await fastify.prisma.purchaseOrder.findFirst({
          where: {
            poNo,
            companyId,
            deletedAt: null,
          },
        });

        if (existing) {
          return reply.status(409).send({
            success: false,
            message: "PO Number already exists.",
          });
        }

        let subtotal = 0;

        for (const item of items) {
          subtotal += item.quantity * item.unitPrice;
        }

        const total = subtotal;
        const po = await fastify.prisma.$transaction(async (tx) => {
          const createdPO = await tx.purchaseOrder.create({
            data: {
              companyId,

              poNo,

              vendorId,

              orderDate: new Date(orderDate),

              expectedDelivery: expectedDelivery
                ? new Date(expectedDelivery)
                : null,

              paymentTerms,

              shippingTerms,

              remarks,

              subtotal: new Prisma.Decimal(subtotal),

              tax: new Prisma.Decimal(0),

              total: new Prisma.Decimal(total),

              createdById: request.user.id,

              status: PurchaseOrderStatus.DRAFT,
            },
          });

          for (const item of items) {
            await tx.purchaseOrderItem.create({
              data: {
                poId: createdPO.id,

                materialId: item.materialId,

                quantity: new Prisma.Decimal(item.quantity),

                unitPrice: new Prisma.Decimal(item.unitPrice),

                totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
              },
            });
          }

          return createdPO;
        });
        const result = await fastify.prisma.purchaseOrder.findUnique({
          where: {
            id: po.id,
          },
          include: {
            vendor: true,

            items: {
              include: {
                material: true,
              },
            },

            createdBy: true,
          },
        });

        adminLogs.info("Purchase Order Created", {
          poId: po.id,
          createdBy: request.user.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Purchase Order created successfully.",
          data: result,
        });
      } catch (error: any) {
        console.log(error);

        adminLogs.error("Purchase Order Creation Failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server Error",
          error: error.message,
        });
      }
    },
  );
}

export default adminPurchaseOrderCreateRoutes;
