import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Query {
  stage?: string;
  search?: string;
}

export default async function listWorkflowOrdersRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/orders",
    {
      schema: {
        tags: ["Workflow Tracker"],
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: Query;
      }>,
      reply: FastifyReply,
    ) => {
      const { stage, search } = request.query;

      const orders = await fastify.prisma.salesOrder.findMany({
        where: {
          ...(stage
            ? {
                workflowStage: stage as any,
              }
            : {}),

          ...(search
            ? {
                OR: [
                  {
                    dveplCode: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    partyName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    caNo: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: {
          workflowUpdatedAt: "desc",
        },

        include: {
          workflowEvents: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          assignments: {
            select: {
              userId: true,
              stage: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: orders.map((order) => ({
          id: order.id,
          dveplCode: order.dveplCode,
          caNo: order.caNo,

          partyName: order.partyName,
          grandTotal: order.grandTotal
            ? Number(order.grandTotal)
            : 0,

          status: order.status,

          workflowStage: order.workflowStage,

          nextAction: order.nextAction,

          dueDate: order.dueDate,

          workflowUpdatedAt: order.workflowUpdatedAt,

          lastEvent: order.workflowEvents[0] ?? null,

          assignments: order.assignments,
        })),

        count: orders.length,
      });
    },
  );
}