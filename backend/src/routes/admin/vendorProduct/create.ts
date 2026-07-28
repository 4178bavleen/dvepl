import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";
import { adminLogs } from "../../../services/logger/contextLogger";
import { vendorProductBulkCreateSchema } from "../../../schemas/admin/vendorProduct/vendor.product.schema";

type VendorProductWithMaterial = Prisma.VendorProductGetPayload<{
  include: {
    material: true;
  };
}>;

async function adminVendorProductCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["VendorProduct"],
        summary: "Attach Products to Vendor",
        description:
          "Bulk-attach one or more materials to a vendor (many-to-many)",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ==========================
        // Validate Request
        // ==========================

        const validationResult = vendorProductBulkCreateSchema.safeParse(
          request.body,
        );

        if (!validationResult.success) {
          adminLogs.error("Invalid vendor-product data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,

            message: "Invalid vendor-product data.",

            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const { vendorId, materialIds } = validationResult.data;

        // ==========================
        // Ensure Vendor Exists
        // ==========================

        const vendor = await fastify.prisma.vendor.findFirst({
          where: { id: vendorId, deletedAt: null },
        });

        if (!vendor) {
          return reply.status(404).send({
            success: false,

            message: "Vendor not found.",
          });
        }

        // ==========================
        // Attach Products (skip duplicates)
        // ==========================

        const created = await fastify.prisma.$transaction(async (tx) => {
          const results: VendorProductWithMaterial[] = [];

          for (const materialId of materialIds) {
            const existing = await tx.vendorProduct.findFirst({
              where: {
                vendorId,
                materialId,
                deletedAt: null,
              },
              include: {
                material: true,
              },
            });

            if (existing) {
              results.push(existing);
              continue;
            }

            const vp = await tx.vendorProduct.create({
              data: {
                vendorId,
                materialId,
                createdById: request.user.id,
              },
              include: {
                material: true,
              },
            });

            results.push(vp);
          }

          return results;
        });

        adminLogs.info("Products attached to vendor", {
          vendorId,
          count: created.length,
        });

        return reply.status(201).send({
          success: true,

          message: "Products attached to vendor successfully.",

          data: created,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Vendor-product attach failed", {
          error,
        });

        return reply.status(500).send({
          success: false,

          message: "Server error while attaching products to vendor.",

          error: error.message,

          stack: error.stack,
        });
      }
    },
  );
}

export default adminVendorProductCreateRoutes;
