import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function adminPurchaseOrderReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Read Purchase Orders",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;
 const { vendorId } = request.query as { vendorId?: string };
        const purchaseOrders =
          await fastify.prisma.purchaseOrder.findMany({
            where: {
              companyId,
              deletedAt: null,
               ...(vendorId ? { vendorId } : {}), 
            },

            include: {
              vendor: true,

              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },

              approvedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },

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

        return reply.status(200).send({
          success: true,
          message: "Purchase Orders fetched successfully.",
          data: purchaseOrders,
        });
      } catch (error: any) {
        console.log(error);

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching Purchase Orders.",
          error: error.message,
        });
      }
    },
  );

  fastify.get(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const companyId = request.user.companyId;

        const purchaseOrder =
          await fastify.prisma.purchaseOrder.findFirst({
            where: {
              id,
              companyId,
              deletedAt: null,
            },

            include: {
              vendor: true,

              createdBy: true,

              approvedBy: true,

              items: {
                include: {
                  material: true,
                },
              },

              goodsReceipts: {
                include: {
                  items: true,
                },
              },

              invoices: true,
            },
          });

        if (!purchaseOrder) {
          return reply.status(404).send({
            success: false,
            message: "Purchase Order not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Purchase Order fetched successfully.",
          data: purchaseOrder,
        });
      } catch (error: any) {
        console.log(error);

        return reply.status(500).send({
          success: false,
          message: "Server error.",
          error: error.message,
        });
      }
    },
  );
}

export default adminPurchaseOrderReadRoutes;