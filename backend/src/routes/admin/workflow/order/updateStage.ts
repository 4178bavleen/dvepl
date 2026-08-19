import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { getActiveWorkflowTemplate } from "../template";

interface Params {
  orderId: string;
}

interface Body {
  stage: string;
  nextAction?: string | null;
  dueDate?: string | null;
  description?: string | null;
}

export default async function updateOrderWorkflowStageRoute(
  fastify: FastifyInstance,
) {
  fastify.patch(
    "/order/:orderId/stage",
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
      const { stage, nextAction, dueDate, description } = request.body;

      // -----------------------------------------
      // 1. Validate stage against the active template
      // -----------------------------------------

      const template = await getActiveWorkflowTemplate(fastify.prisma);

      const activeStep = template?.steps?.find(
        (s: any) => s.key === stage && s.isActive,
      );

      if (!activeStep) {
        return reply.code(400).send({
          success: false,
          message: `Invalid workflow stage "${stage}".`,
        });
      }

      // -----------------------------------------
      // 2. Find order
      // -----------------------------------------

      const order = await fastify.prisma.salesOrder.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          workflowStage: true,
          nextAction: true,
          dueDate: true,
        },
      });

      if (!order) {
        return reply.code(404).send({
          success: false,
          message: "Sales order not found",
        });
      }

      // -----------------------------------------
      // 3. Prevent unnecessary update
      // -----------------------------------------

      if (order.workflowStage === stage && nextAction === undefined && dueDate === undefined) {
        return reply.code(400).send({
          success: false,
          message: `Order is already in ${activeStep.name}`,
        });
      }

      // -----------------------------------------
      // 4. Current user
      // -----------------------------------------

      const userId = (request.user as any)?.id ?? null;

      // -----------------------------------------
      // 5. Update order + create history
      // -----------------------------------------

      const result = await fastify.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.salesOrder.update({
          where: {
            id: orderId,
          },
          data: {
            workflowStage: stage,
            workflowUpdatedAt: new Date(),
            ...(nextAction !== undefined ? { nextAction } : {}),
            ...(dueDate !== undefined
              ? { dueDate: dueDate ? new Date(dueDate) : null }
              : {}),
          },
        });

        const workflowEvent = await tx.workflowEvent.create({
          data: {
            salesOrderId: orderId,
            stage,
            title: activeStep.name,
            description: description ?? null,
            performedById: userId,
          },
        });

        return {
          updatedOrder,
          workflowEvent,
        };
      });

      // -----------------------------------------
      // 6. Response
      // -----------------------------------------

      return reply.send({
        success: true,
        message: "Workflow stage updated successfully",
        data: result,
      });
    },
  );
}