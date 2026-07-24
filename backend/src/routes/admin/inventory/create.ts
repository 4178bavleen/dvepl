import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";

import { adminLogs } from "../../../services/logger/contextLogger";
import { inventorySchema } from "../../../schemas/admin/inventory/inventory.schema";

async function adminInventoryCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Create Inventory Item",
        description: "Create Material & Opening Inventory",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ==========================
        // Validate Request
        // ==========================

        const validationResult = inventorySchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid Inventory data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid Inventory data.",
            error: validationResult.error.issues,
          });
        }

        const {
          materialCode,
          name,
          notes,
          category,
          type,
          hsnCode,
          gst,
          unit,
          weight,
          color,
          reorderLevel,
          reorderQty,
          vendorLeadDays,
          vendorName,
          vendorContact,
          warehouseId,
          binId,
          openingStock,
          unitRate,
          batchNo,
          serialNo,
          barcode,
          qrCode,
          expiryDate,
          location,
        } = validationResult.data;

        const companyId = request.user.companyId;

        // =========================================
        // Duplicate Material Code
        // =========================================

        const existingMaterial = await fastify.prisma.material.findUnique({
          where: {
            materialCode,
          },
        });

        if (existingMaterial) {
          return reply.status(409).send({
            success: false,
            message: "Material code already exists.",
          });
        }

        // =========================================
        // Company Validation
        // =========================================

        const company = await fastify.prisma.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        // =========================================
        // Category Validation
        // =========================================
        // const materialCategory =
        //   await fastify.prisma.materialCategory.findFirst({
        //     where: {
        //       companyId,
        //       name: category.trim(),
        //       deletedAt: null,
        //     },
        //   });
        // if (!materialCategory) {
        //   return reply.status(404).send({
        //     success: false,
        //     message: "Material category not found.",
        //   });
        // }

        // =========================================
        // Warehouse Validation
        // =========================================

        // const warehouse = await fastify.prisma.warehouse.findUnique({
        //   where: {
        //     id: warehouseId,
        //   },
        // });

        // if (!warehouse) {
        //   return reply.status(404).send({
        //     success: false,
        //     message: "Warehouse not found.",
        //   });
        // }

        // =========================================
        // Bin Validation
        // =========================================

        if (binId) {
          const bin = await fastify.prisma.bin.findUnique({
            where: {
              id: binId,
            },
          });

          if (!bin) {
            return reply.status(404).send({
              success: false,
              message: "Bin not found.",
            });
          }
        }

        // =========================================
        // Transaction
        // =========================================

        const result = await fastify.prisma.$transaction(async (tx) => {
          let vendorId: string | null = null;

          if (vendorName?.trim()) {
            let vendor = await tx.vendor.findFirst({
              where: {
                companyId,
                name: vendorName.trim(),
                deletedAt: null,
              },
            });

            if (!vendor) {
              vendor = await tx.vendor.create({
                data: {
                  companyId,
                  name: vendorName.trim(),
                  phone: vendorContact ?? null,
                  createdById: request.user.id,
                },
              });
            }

            vendorId = vendor.id;
          }
          // =========================================
          // Create Material
          // =========================================

          const material = await tx.material.create({
            data: {
              companyId,

              materialCode,

              name,

              description: notes ?? null,

              category,

              type,

              hsnCode,

              gst: new Prisma.Decimal(gst),

              unit,

              weight: weight != null ? new Prisma.Decimal(weight) : null,

              color,

              reorderLevel:
                reorderLevel != null ? new Prisma.Decimal(reorderLevel) : null,

              reorderQty:
                reorderQty != null ? new Prisma.Decimal(reorderQty) : null,

              leadDays: vendorLeadDays ?? null,

              preferredVendorId: vendorId,

              createdById: request.user.id,
            },
          });
          // =========================================
          // Create Inventory
          // =========================================

          const inventory = await tx.inventory.create({
            data: {
              companyId,

              materialId: material.id,

              warehouseId: warehouseId ?? null,

              binId: binId ?? null,

              quantity: new Prisma.Decimal(openingStock),

              reservedQty: new Prisma.Decimal(0),

              damagedQty: new Prisma.Decimal(0),

              scrapQty: new Prisma.Decimal(0),

              transitQty: new Prisma.Decimal(0),

              stockType: "AVAILABLE",

              unitPrice: new Prisma.Decimal(unitRate),

              batchNo: batchNo ?? null,

              serialNo: serialNo ?? null,

              barcode: barcode ?? null,

              qrCode: qrCode ?? null,

              expiryDate: expiryDate ? new Date(expiryDate) : null,

              location: location ?? null,
            },
          });

          return inventory;
        });

        // =========================================
        // Fetch Created Inventory
        // =========================================

        const createdInventory = await fastify.prisma.inventory.findUnique({
          where: {
            id: result.id,
          },
          include: {
            material: true,
            bin: true,
            company: true,
          },
        });

        adminLogs.info("Inventory Item created successfully", {
          inventoryId: result.id,
          materialCode,
          createdBy: (request as any).admin.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Inventory Item created successfully.",
          data: createdInventory,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Inventory creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating Inventory.",
          error: error.message,
          stack: error.stack,
        });
      }
    },
  );
}

export default adminInventoryCreateRoutes;
