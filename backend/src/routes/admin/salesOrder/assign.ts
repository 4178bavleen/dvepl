import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { z } from "zod";

import NotificationService  from "../../../services/notification/notification.service"

const stageAssignmentSchema = z.object({
  stage: z.string().nullable().optional(),
  userIds: z
    .array(z.string().uuid())
    .min(1, "At least one user must be assigned."),
});

const assignSalesOrderSchema = z.object({
  assignments: z
    .array(stageAssignmentSchema)
    .min(1, "At least one stage assignment is required."),
});

// Backward compatible: { userIds: [...] } treated as a whole-order (all stages) assignment.
const legacyAssignSalesOrderSchema = z.object({
  userIds: z
    .array(z.string().uuid())
    .min(1, "At least one user must be assigned.")
    .refine(
      (userIds) => new Set(userIds).size === userIds.length,
      "Duplicate user IDs are not allowed.",
    ),
});

interface Params {
  id: string;
}

export default async function assignSalesOrderRoute(
  fastify: FastifyInstance,
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Assign Sales Order",
        description:
          "Assign a sales order to one or more users, optionally per workflow stage. " +
          "A null stage means the whole order (all stages).",
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
        Body: {
          assignments?: Array<{ stage?: string | null; userIds: string[] }>;
          userIds?: string[];
        };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        // ==========================================
        // Validate Request Body
        // ==========================================

        let assignments: Array<{ stage?: string | null; userIds: string[] }>;

        const modernResult = assignSalesOrderSchema.safeParse(request.body);
        const legacyResult = legacyAssignSalesOrderSchema.safeParse(request.body);

        if (modernResult.success) {
          assignments = modernResult.data.assignments;
        } else if (legacyResult.success) {
          assignments = [{ stage: null, userIds: legacyResult.data.userIds }];
        } else {
          return reply.status(400).send({
            success: false,
            message: "Invalid assignment data.",
            error: modernResult.error.issues,
          });
        }

        // ==========================================
        // Check Sales Order
        // ==========================================

        const salesOrder = await fastify.prisma.salesOrder.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          select: {
            id: true,
            dveplCode: true,
            companyId: true,
            partyName: true,
            workflowStage: true,
          },
        });

        if (!salesOrder) {
          return reply.status(404).send({
            success: false,
            message: "Sales Order not found.",
          });
        }

        // ==========================================
        // Validate Stages Against Active Template
        // ==========================================

        const activeTemplate = await fastify.prisma.workflowTemplate.findFirst({
          where: { isActive: true },
          include: { steps: { where: { isActive: true } } },
        });

        const validStageKeys = new Set(
          (activeTemplate?.steps ?? []).map((step: any) => step.key),
        );

        const invalidStages = assignments
          .map((a) => a.stage)
          .filter((stage) => stage !== null && stage !== undefined && !validStageKeys.has(stage));

        if (invalidStages.length > 0) {
          return reply.status(400).send({
            success: false,
            message: `Invalid workflow stage(s): ${invalidStages.join(", ")}.`,
            invalidStages,
          });
        }

        // ==========================================
        // Validate Users (deduped across all stages)
        // ==========================================

        const uniqueUserIds = Array.from(
          new Set(assignments.flatMap((a) => a.userIds)),
        );

        if (uniqueUserIds.length === 0) {
          return reply.status(400).send({
            success: false,
            message: "At least one user must be assigned.",
          });
        }

        const users = await fastify.prisma.user.findMany({
          where: {
            id: {
              in: uniqueUserIds,
            },
            companyId: salesOrder.companyId,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        if (users.length !== uniqueUserIds.length) {
          const foundUserIds = new Set(users.map((user) => user.id));

          const invalidUserIds = uniqueUserIds.filter(
            (userId) => !foundUserIds.has(userId),
          );

          return reply.status(404).send({
            success: false,
            message:
              "One or more users were not found, inactive, deleted, or do not belong to this company.",
            invalidUserIds,
          });
        }

        // ==========================================
        // Replace Existing Assignments
        // ==========================================

        const newAssignments = await fastify.prisma.$transaction(
          async (tx) => {
            await tx.salesOrderAssignment.deleteMany({
              where: {
                salesOrderId: salesOrder.id,
              },
            });

            await tx.salesOrderAssignment.createMany({
              data: assignments.flatMap((a) =>
                a.userIds.map((userId) => ({
                  salesOrderId: salesOrder.id,
                  userId,
                  stage: a.stage ?? null,
                })),
              ),
            });

            return tx.salesOrderAssignment.findMany({
              where: {
                salesOrderId: salesOrder.id,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            });
          },
        );

      // ==========================================
// Send Assignment Emails
// ==========================================

const emailResults = await Promise.allSettled(
  users.map(async (user) => {
    if (!user.email) {
      throw new Error(
        `User ${user.name || user.id} does not have an email address.`,
      );
    }

    await NotificationService.sendSalesOrderAssignmentNotification({
      to: user.email,
      userName: user.name || "User",
      dveplCode: salesOrder.dveplCode,
    }, salesOrder.companyId);
  }),
);

        // ==========================================
        // Log Email Results
        // ==========================================

        const failedEmails = emailResults.filter(
          (result) => result.status === "rejected",
        );

        if (failedEmails.length > 0) {
          failedEmails.forEach((result) => {
            if (result.status === "rejected") {
              request.log.error(
                result.reason,
                "Failed to send Sales Order assignment email",
              );
            }
          });
        }

        // ==========================================
        // Response
        // ==========================================

        return reply.status(200).send({
          success: true,
          message:
            failedEmails.length === 0
              ? "Sales Order assigned successfully and notification emails sent."
              : "Sales Order assigned successfully, but one or more notification emails failed.",
          data: {
            salesOrderId: salesOrder.id,
            dveplCode: salesOrder.dveplCode,
            assignments: newAssignments,
            notifications: {
              total: uniqueUserIds.length,
              sent: uniqueUserIds.length - failedEmails.length,
              failed: failedEmails.length,
            },
          },
        });
      } catch (error) {
        request.log.error(
          error,
          "Failed to assign Sales Order",
        );

        return reply.status(500).send({
          success: false,
          message: "Failed to assign Sales Order.",
        });
      }
    },
  );
}