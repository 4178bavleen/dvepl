import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { WorkflowStage } from "@prisma/client";

interface Params {
  orderId: string;
}

interface Body {
  stage: WorkflowStage;
}

export default async function updateOrderWorkflowStageRoute(
  fastify: FastifyInstance,
) {
  fastify.patch(
    "/workflow/order/:orderId/stage",
    {
      schema: {
        tags: ["Workflow Tracker"],
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
        Body: Body;
      }>,
      reply: FastifyReply,
    ) => {
      const { orderId } = request.params;
      const { stage } = request.body;

      // -----------------------------------------
      // 1. Find order
      // -----------------------------------------

      const order = await fastify.prisma.salesOrder.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          workflowStage: true,
        },
      });

      if (!order) {
        return reply.code(404).send({
          success: false,
          message: "Sales order not found",
        });
      }

      // -----------------------------------------
      // 2. Prevent unnecessary update
      // -----------------------------------------

      if (order.workflowStage === stage) {
        return reply.code(400).send({
          success: false,
          message: `Order is already in ${stage}`,
        });
      }

      // -----------------------------------------
      // 3. Current user
      // -----------------------------------------

      const userId = (request.user as any)?.id ?? null;

      // -----------------------------------------
      // 4. Update order + create history
      // -----------------------------------------

      const result = await fastify.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.salesOrder.update({
          where: {
            id: orderId,
          },
          data: {
            workflowStage: stage,
            workflowUpdatedAt: new Date(),
          },
        });

        const workflowEvent = await tx.workflowEvent.create({
          data: {
            salesOrderId: orderId,
            stage,
            title: getWorkflowStageTitle(stage),
            performedById: userId,
          },
        });

        return {
          updatedOrder,
          workflowEvent,
        };
      });

      // -----------------------------------------
      // 5. Response
      // -----------------------------------------

      return reply.send({
        success: true,
        message: "Workflow stage updated successfully",
        data: result,
      });
    },
  );
}


// -----------------------------------------
// Stage → Human readable title
// -----------------------------------------

function getWorkflowStageTitle(stage: WorkflowStage): string {
  const titles: Record<WorkflowStage, string> = {
    ORDER_CONFIRMED: "Order Confirmed",
    PO_READY: "PO Ready",
    DRAWING_ASSIGNED: "Drawing Assigned",
    DRAWING_SENT: "Drawing Sent",
    REVISION_REQUIRED: "Revision Required",
    DRAWING_APPROVED: "Drawing Approved",
    PO_PLACED: "PO Placed",
    INVENTORY_FOLLOW_UP: "Inventory Follow-up",
    PRODUCTION_FOLLOW_UP: "Production Follow-up",
  };

  return titles[stage];
}