import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function adminInventoryVendorTrackingRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Vendor Order Tracking",
        description:
          "Track ordered quantity, received quantity and pending quantity vendor wise",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;

        const poItems = await fastify.prisma.purchaseOrderItem.findMany({
          where: {
            po: {
              companyId,
              deletedAt: null,
            },
          },

          include: {
            po: {
              include: {
                vendor: true,
              },
            },

            material: true,
          },
        });

        const tracking = poItems.map((item) => {
          const orderedQty = Number(item.quantity);

          const receivedQty = 0;

          const pendingQty = orderedQty - receivedQty;

          let status = "PENDING";

          if (receivedQty === 0) {
            status = "PENDING";
          } else if (receivedQty < orderedQty) {
            status = "PARTIAL";
          } else {
            status = "COMPLETED";
          }

          return {
            poId: item.po.id,

            poNo: item.po.poNo,

            vendor: {
              id: item.po.vendor?.id,
              name: item.po.vendor?.name,
            },

            material: {
              id: item.material.id,
              name: item.material.name,
              code: item.material.materialCode,
            },

            orderedQty,

            receivedQty,

            pendingQty,

            status,
          };
        });

        return reply.send({
          success: true,

          data: tracking,
        });
      } catch (error: any) {
        console.error(error);

        return reply.status(500).send({
          success: false,

          message: "Failed to fetch vendor tracking",

          error: error.message,
        });
      }
    },
  );
}

export default adminInventoryVendorTrackingRoutes;
