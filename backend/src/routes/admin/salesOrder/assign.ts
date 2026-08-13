import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { z } from "zod";

import NotificationService  from "../../../services/notification/notification.service"

const assignSalesOrderSchema = z.object({
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
        description: "Assign a sales order to one or more users.",
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
        Body: {
          userIds: string[];
        };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        // ==========================================
        // Validate Request Body
        // ==========================================

        const validationResult = assignSalesOrderSchema.safeParse(
          request.body,
        );

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid assignment data.",
            error: validationResult.error.issues,
          });
        }

        const { userIds } = validationResult.data;

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
          },
        });

        if (!salesOrder) {
          return reply.status(404).send({
            success: false,
            message: "Sales Order not found.",
          });
        }

        // ==========================================
        // Validate Users
        // ==========================================

        const users = await fastify.prisma.user.findMany({
          where: {
            id: {
              in: userIds,
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

        if (users.length !== userIds.length) {
          const foundUserIds = new Set(users.map((user) => user.id));

          const invalidUserIds = userIds.filter(
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

        const assignments = await fastify.prisma.$transaction(
          async (tx) => {
            await tx.salesOrderAssignment.deleteMany({
              where: {
                salesOrderId: salesOrder.id,
              },
            });

            await tx.salesOrderAssignment.createMany({
              data: userIds.map((userId) => ({
                salesOrderId: salesOrder.id,
                userId,
              })),
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
    });
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
            assignments,
            notifications: {
              total: users.length,
              sent: users.length - failedEmails.length,
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