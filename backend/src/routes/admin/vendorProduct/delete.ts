import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function adminVendorProductDeleteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["VendorProduct"],
        summary: "Detach Product from Vendor",
        description: "Soft-delete a vendor-product association",
      },
    },

    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        const existing = await fastify.prisma.vendorProduct.findFirst({
          where: { id, deletedAt: null },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,

            message: "Vendor-product association not found.",
          });
        }

        await fastify.prisma.vendorProduct.update({
          where: { id },

          data: { deletedAt: new Date() },
        });

        adminLogs.info("Vendor-product association removed", { id });

        return reply.status(200).send({
          success: true,

          message: "Product detached from vendor successfully.",
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Vendor-product delete failed", {
          error,
        });

        return reply.status(500).send({
          success: false,

          message: "Server error while detaching product from vendor.",

          error: error.message,

          stack: error.stack,
        });
      }
    },
  );
}

export default adminVendorProductDeleteRoutes;

//prefix - vendor-product