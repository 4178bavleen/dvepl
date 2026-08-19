import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { WorkflowStage } from "@prisma/client";
import NotificationService from "../../../../services/notification/notification.service";
import { getActiveWorkflowTemplate } from "../template";
import {
  canWorkOnOrderStage,
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

      const order = await fastify.prisma.salesOrder.findUnique({
        where: {
          id: orderId,
        },
        select: {
          id: true,
          workflowStage: true,
          nextAction: true,
          dueDate: true,
          dveplCode: true,
          companyId: true,
          assignments: {
            select: {
              userId: true,
              stage: true,
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

      // -----------------------------------------
      // 3. Stage-based access control
      // -----------------------------------------

      const userId = (request.admin as any)?.id ?? (request.user as any)?.id ?? null;
      const admin = request.admin ?? request.user;

      if (!canWorkOnOrderStage(order.assignments, order.workflowStage, userId, isAdminUser(admin))) {
        return reply.code(403).send({
          success: false,
          message:
            "Access denied: you are not assigned to work on this order at its current stage.",
        });
      }

      // -----------------------------------------
      // 4. Prevent unnecessary update
      // -----------------------------------------

      if (order.workflowStage === stage && nextAction === undefined && dueDate === undefined) {
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
      // 4.5. Send reminder to assigned users if nextAction or dueDate is updated
      // -----------------------------------------
      if (nextAction || dueDate) {
        try {
          const assignments = await fastify.prisma.salesOrderAssignment.findMany({
            where: {
              salesOrderId: orderId,
            },
            include: {
              user: true,
            },
          });

          const formattedDueDate = dueDate
            ? new Date(dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";

          const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

          for (const assignment of assignments) {
            const user = assignment.user;
            if (user && user.email) {
              const subject = `Workflow Reminder: Sales Order ${order.dveplCode}`;
              const htmlMessage = `
                Hello ${user.name || "User"},<br/><br/>
                This is a follow-up reminder for Sales Order <strong>${order.dveplCode}</strong> assigned to you.<br/><br/>
                <strong>Next Action:</strong> ${nextAction || "—"}<br/>
                <strong>Due Date:</strong> ${formattedDueDate}<br/>
                ${description ? `<strong>Notes:</strong> ${description}<br/>` : ""}
                <br/>
                Please <a href="${frontendUrl}/workflow" style="color: #33cc33; font-weight: bold; text-decoration: underline;">click here to log in and view the Workflow Tracker</a> to complete this action.
              `;

              await NotificationService.sendCustomNotification(
                {
                  to: user.email,
                  subject: subject,
                  message: htmlMessage,
                  eventCode: "WORKFLOW_REMINDER",
                  relatedModule: "salesOrder",
                  relatedRecordId: orderId,
                },
                order.companyId,
              );
            }
          }
        } catch (notifErr) {
          // Log notification error but don't fail the workflow update
          fastify.log.error(notifErr, "Failed to send workflow reminder notifications");
        }
      }

      // -----------------------------------------
      // 5. Response
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