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

        remarks: z.string().optional().nullable(),
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


        const vendor = await fastify.prisma.vendor.findFirst({
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
            await ensureMaterialExists(tx, item.materialId, companyId, request.user.id);

            await tx.purchaseOrderItem.create({
              data: {
                poId: createdPO.id,

                materialId: item.materialId,

                quantity: new Prisma.Decimal(item.quantity),

                unitPrice: new Prisma.Decimal(item.unitPrice),

                totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),

                remarks: item.remarks,
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

        if (error.message && error.message.includes("does not exist in the system")) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }

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
