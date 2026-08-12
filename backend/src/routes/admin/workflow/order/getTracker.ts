import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  orderId: string;
}

export default async function getOrderWorkflowTrackerRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/order/:orderId/tracker",
    {
      schema: {
        tags: ["Workflow Tracker"],
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
      }>,
      reply: FastifyReply,
    ) => {
      const { orderId } = request.params;

      const order = await fastify.prisma.salesOrder.findUnique({
        where: {
          id: orderId,
        },
        include: {
          workflowEvents: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!order) {
        return reply.code(404).send({
          success: false,
          message: "Sales order not found",
        });
      }

      return reply.send({
        success: true,
        data: {
          orderId: order.id,
          workflowStage: order.workflowStage,
          nextAction: order.nextAction,
          dueDate: order.dueDate,
          workflowUpdatedAt: order.workflowUpdatedAt,

          timeline: order.workflowEvents,
        },
      });
    },
  );
}