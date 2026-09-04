import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { vendorProductReadQuerySchema  } from "../../../schemas/admin/vendorProduct/vendor.product.schema";

async function adminVendorProductReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["VendorProduct"],
        summary: "Read Vendor Products",
        description:
          "List products attached to a vendor, or vendors attached to a product",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["vendor.view"]),
      ],
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = vendorProductReadQuerySchema.safeParse(
          request.query,
        );

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,

            message: "Invalid query parameters.",

            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const { vendorId, materialId } = validationResult.data;

        const vendorProducts = await fastify.prisma.vendorProduct.findMany({
          where: {
            deletedAt: null,

            ...(vendorId ? { vendorId } : {}),

            ...(materialId ? { materialId } : {}),
          },

          include: {
            material: true,

            vendor: true,
          },

          orderBy: { createdAt: "desc" },
        });

        return reply.status(200).send({
          success: true,

          message: "Vendor products fetched successfully.",

          data: vendorProducts,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Vendor-product fetch failed", {
          error,
        });

        return reply.status(500).send({
          success: false,

          message: "Server error while fetching vendor products.",

          error: error.message,

          stack: error.stack,
        });
      }
    },
  );
}

export default adminVendorProductReadRoutes;