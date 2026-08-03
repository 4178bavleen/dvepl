import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
interface InventoryTracking {
  poId: string;
  poNo: string;

  vendorId: string;
  vendor: string;

  materialId: string;
  material: string;

  category: string | null;

  orderedQty: number;
  receivedQty: number;
  pendingQty: number;

  unit: string;

  status: "RECEIVED" | "PENDING" | "PARTIAL";

  expectedDelivery: Date | null;

  delayed: boolean;
  delayDays: number;
}
async function adminInventoryTrackingRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Inventory"],
        summary: "Inventory Tracking",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;
        const purchaseOrders = await fastify.prisma.purchaseOrder.findMany({
          where: {
            companyId,
            deletedAt: null,
          },

          include: {
            vendor: true,

            items: {
              include: {
                material: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });
        const tracking: InventoryTracking[] = [];

        for (const po of purchaseOrders) {
          for (const item of po.items) {
            const pendingQty = Number(item.quantity) - Number(item.receivedQty);

            const delayed = po.expectedDelivery
              ? new Date(po.expectedDelivery) < new Date() && pendingQty > 0
              : false;

            tracking.push({
              poId: po.id,

              poNo: po.poNo,

              vendorId: po.vendorId,

              vendor: po.vendor.name,

              materialId: item.materialId,

              material: item.material.name,

              category: item.material.category,

              orderedQty: Number(item.quantity),

              receivedQty: Number(item.receivedQty),

              pendingQty,

              unit: item.material.unit,

              status:
                pendingQty === 0
                  ? "RECEIVED"
                  : pendingQty === Number(item.quantity)
                    ? "PENDING"
                    : "PARTIAL",

              expectedDelivery: po.expectedDelivery,

              delayed,

              delayDays: delayed
                ? Math.ceil(
                    (new Date().getTime() -
                      new Date(po.expectedDelivery!).getTime()) /
                      86400000,
                  )
                : 0,
            });
          }
        }
        return reply.send({
          success: true,

          message: "Inventory Tracking fetched successfully.",

          data: tracking,
        });
      } catch (error: any) {
        console.log(error);

        return reply.status(500).send({
          success: false,

          message: "Server Error",

          error: error.message,
        });
      }
    },
  );
}

export default adminInventoryTrackingRoutes;
