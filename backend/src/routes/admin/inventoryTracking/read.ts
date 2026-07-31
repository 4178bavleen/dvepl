import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

export default async function (
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const companyId = request.user.companyId;

      const items = await fastify.prisma.purchaseOrderItem.findMany({
        where: {
          deletedAt: null,
          po: {
            companyId,
            deletedAt: null,
          },
        },
        include: {
          material: true,
          po: {
            include: {
              vendor: true,
            },
          },
        },
      });

      const data = items.map((item) => {
        const ordered = Number(item.quantity);
        const received = Number(item.receivedQty);

        return {
          id: item.id,

          poNo: item.po.poNo,

          vendor: item.po.vendor.name,

          material: item.material.name,

          orderedQty: ordered,

          receivedQty: received,

          pendingQty: ordered - received,

          expectedDelivery:
            item.expectedDelivery ?? item.po.expectedDelivery,

          trackingStatus: item.trackingStatus,

          trackingRemarks: item.trackingRemarks,

          lastReceivedAt: item.lastReceivedAt,
        };
      });

      return reply.send({
        success: true,
        data,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        message: error.message,
      });
    }
  });
}