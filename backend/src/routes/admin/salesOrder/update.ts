import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";

import { adminLogs } from "../../../services/logger/contextLogger";

import { salesOrderSchema } from "../../../schemas/admin/salesOrder/salesOrder.schema";

interface Params {
  id: string;
}

async function adminSalesOrderUpdateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Update Sales Order",
        description: "Update existing sales order",
      },
    },

    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        // ==========================
        // Validate Body
        // ==========================

        const validationResult = salesOrderSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid Sales Order update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid Sales Order data.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const {
          companyId,
          status,

          orderTakenById,
          assignedToIds,

          partyName,
          caNo,
          contactDetails,

          orderConfirmDate,
          deliveryMonthTarget,
          poDate,

          drawingConcernedPerson,
          drawingApprovedDate,
          drawingStatus,
          drawingRemarks,

          inspectionField,
          sendNotification,
          remarks,

          items,
        } = validationResult.data;

        // ==========================
        // Check Existing Order
        // ==========================

        const existingOrder = await fastify.prisma.salesOrder.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingOrder) {
          return reply.status(404).send({
            success: false,
            message: "Sales Order not found.",
          });
        }

        // ==========================
        // Company Validation
        // ==========================

        const company = await fastify.prisma.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        // ==========================
        // Order Taken By Validation
        // ==========================
console.log("orderTakenById:", orderTakenById);
        if (orderTakenById) {
          const user = await fastify.prisma.user.findUnique({
            where: {
              id: orderTakenById,
            },
          });

          if (!user) {
            return reply.status(404).send({
              success: false,
              message: "Order Taken By user not found.",
            });
          }
        } 
        // ==========================
        // Assigned Users Validation
        // ==========================

        const assignedToId = (assignedToIds || []).filter((id): id is string => id !== null);

        if (assignedToId.length > 0) {
          const users = await fastify.prisma.user.findMany({
            where: {
              id: {
                in: assignedToId,
              },
            },
          });

          if (users.length !== assignedToId.length) {
            return reply.status(404).send({
              success: false,
              message: "One or more assigned users not found.",
            });
          }
        }

        // ==========================
        // Calculate Totals
        // ==========================

        let subtotal = 0;
        let gstTotal = 0;

        for (const item of items) {
          const itemAmount = Number(item.quantity) * Number(item.rate);

          const itemGST = (itemAmount * Number(item.gstPercentage)) / 100;

          subtotal += itemAmount;

          gstTotal += itemGST;
        }

        const grandTotal = subtotal + gstTotal;

        // ==========================
        // Update Transaction
        // ==========================

        const updatedOrderId = await fastify.prisma.$transaction(async (tx) => {
          // ==========================
          // Update Sales Order
          // ==========================

          const updatedOrder = await tx.salesOrder.update({
            where: {
              id,
            },

            data: {
              companyId,

              status,

              orderTakenById: orderTakenById ?? null,

              partyName,

              caNo: caNo ?? null,

              contactDetails: contactDetails ?? null,

              orderConfirmDate: orderConfirmDate
                ? new Date(orderConfirmDate)
                : null,

              deliveryMonthTarget: deliveryMonthTarget ?? null,

              poDate: poDate ? new Date(poDate) : null,

              drawingConcernedPerson: drawingConcernedPerson ?? null,

              drawingApprovedDate: drawingApprovedDate
                ? new Date(drawingApprovedDate)
                : null,

              drawingStatus: drawingStatus === "APPROVED"
                ? "COMPLETED"
                : drawingStatus === "REJECTED"
                ? "ON_HOLD"
                : drawingStatus as any,

              drawingRemarks: drawingRemarks ?? null,

              subtotal: new Prisma.Decimal(subtotal),

              gstTotal: new Prisma.Decimal(gstTotal),

              grandTotal: new Prisma.Decimal(grandTotal),

              inspectionField: inspectionField ?? null,

              sendNotification,

              remarks: remarks ?? null,
            },
          });

          // ==========================
          // Replace Items
          // ==========================

          await tx.salesOrderItem.deleteMany({
            where: {
              salesOrderId: id,
            },
          });

          if (items.length > 0) {
            await tx.salesOrderItem.createMany({
              data: items.map((item) => ({
                salesOrderId: updatedOrder.id,

                itemCode: item.itemCode,

                description: item.description,

                unit: "Nos",

                quantity: new Prisma.Decimal(item.quantity),

                unitPrice: new Prisma.Decimal(item.rate),

                gstPercentage: new Prisma.Decimal(item.gstPercentage),

                totalPrice: new Prisma.Decimal(
                  Number(item.quantity) * Number(item.rate),
                ),

                remarks: item.remarks ?? null,
              })),
            });
          }

          // ==========================
          // Replace Assignments
          // ==========================

          await tx.salesOrderAssignment.deleteMany({
            where: {
              salesOrderId: id,
            },
          });

          if (assignedToId.length > 0) {
            const employees = await tx.employee.findMany({
              where: {
                userId: {
                  in: assignedToId,
                },
              },
              select: {
                id: true,
                userId: true,
              },
            });

            const assignments = employees.map((emp) => ({
              salesOrderId: id,
              employeeId: emp.id,
              userId: emp.userId,
            }));

            if (assignments.length > 0) {
              await tx.salesOrderAssignment.createMany({
                data: assignments,
                skipDuplicates: true,
              });
            }
          }

          return updatedOrder.id;
        });

        const updatedOrder = await fastify.prisma.salesOrder.findUnique({
          where: {
            id: updatedOrderId,
          },

          include: {
            company: true,

            orderTakenBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            items: true,

            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        adminLogs.info("Sales Order updated successfully", {
          salesOrderId: id,
        });

        return reply.status(200).send({
          success: true,

          message: "Sales Order updated successfully.",

          data: updatedOrder,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Sales Order update failed", {
          error,
        });

        return reply.status(500).send({
          success: false,

          message: "Server error while updating Sales Order.",

          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminSalesOrderUpdateRoutes;
