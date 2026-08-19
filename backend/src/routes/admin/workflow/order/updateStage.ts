import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { WorkflowStage } from "@prisma/client";
import { getActiveWorkflowTemplate } from "../template";
import {
  canWorkOnOrderStage,
  fetchOrderWithAssignments,
  isAdminUser,
} from "../../../../utils/orderAccess";

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
      preHandler: [fastify.verifyToken],
      schema: {
        tags: ["Workflow Tracker"],
      },
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const { orderId } = request.params as Params;
      const { stage, nextAction, dueDate, description } =
        request.body as Body;

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

      // Fetch assignments via the shared helper (handles the stage field correctly
      // even when the Prisma generated client is stale).
      const orderWithAssignments = await fetchOrderWithAssignments(
        fastify.prisma as any,
        orderId,
      );

      if (!orderWithAssignments) {
        return reply.code(404).send({
          success: false,
          message: "Sales order not found",
        });
      }

      // Also fetch the extra scalar fields we need (nextAction, dueDate).
      const order = await fastify.prisma.salesOrder.findUnique({
        where: { id: orderId },
        select: {
          workflowStage: true,
          nextAction: true,
          dueDate: true,
        },
      });

      // -----------------------------------------
      // 3. Stage-based access control
      // -----------------------------------------

      const userId = (request.admin as any)?.id ?? (request.user as any)?.id ?? null;
      const admin = request.admin ?? request.user;

      if (!canWorkOnOrderStage(
        orderWithAssignments.assignments,
        orderWithAssignments.workflowStage,
        userId,
        isAdminUser(admin),
      )) {
        return reply.code(403).send({
          success: false,
          message:
            "Access denied: you are not assigned to work on this order at its current stage.",
        });
      }

      // -----------------------------------------
      // 4. Prevent unnecessary update
      // -----------------------------------------

      if (order?.workflowStage === stage && nextAction === undefined && dueDate === undefined) {
        return reply.code(400).send({
          success: false,
          message: `Order is already in ${activeStep.name}`,
        });
      }

      // -----------------------------------------
      // 5. Update order + create history
      // -----------------------------------------

      const result = await fastify.prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.salesOrder.update({
          where: {
            id: orderId,
          },
          data: {
            workflowStage: stage as WorkflowStage,
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
            stage: stage as WorkflowStage,
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