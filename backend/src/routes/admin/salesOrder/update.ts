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

        const validationResult = salesOrderSchema.partial().safeParse(request.body);

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
          dveplCode,
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
        // Company Validation (If provided)
        // ==========================

        if (companyId) {
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
        }

        // ==========================
        // Order Taken By Validation
        // ==========================
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
        // Calculate Totals (If items provided)
        // ==========================

        let subtotal: number | undefined;
        let gstTotal: number | undefined;
        let grandTotal: number | undefined;

        if (items && items.length > 0) {
          subtotal = 0;
          gstTotal = 0;

          for (const item of items) {
            const itemAmount = Number(item.quantity) * Number(item.rate);
            const itemGST = (itemAmount * Number(item.gstPercentage)) / 100;
            subtotal += itemAmount;
            gstTotal += itemGST;
          }

          grandTotal = subtotal + gstTotal;
        }

        // ==========================
        // Update Transaction
        // ==========================

        const updatedOrderId = await fastify.prisma.$transaction(async (tx) => {
          // ==========================
          // Update Sales Order
          // ==========================

          const updateData: any = {};
          if (companyId !== undefined) updateData.companyId = companyId;
          if (dveplCode !== undefined) updateData.dveplCode = dveplCode;
          if (status !== undefined) updateData.status = status;
          if (orderTakenById !== undefined) updateData.orderTakenById = orderTakenById;
          if (assignedToIds !== undefined) updateData.assignedToIds = assignedToId;
          if (partyName !== undefined) updateData.partyName = partyName;
          if (caNo !== undefined) updateData.caNo = caNo;
          if (contactDetails !== undefined) updateData.contactDetails = contactDetails;
          if (orderConfirmDate !== undefined) updateData.orderConfirmDate = orderConfirmDate ? new Date(orderConfirmDate) : null;
          if (deliveryMonthTarget !== undefined) updateData.deliveryMonthTarget = deliveryMonthTarget;
          if (poDate !== undefined) updateData.poDate = poDate ? new Date(poDate) : null;
          if (drawingConcernedPerson !== undefined) updateData.drawingConcernedPerson = drawingConcernedPerson;
          if (drawingApprovedDate !== undefined) updateData.drawingApprovedDate = drawingApprovedDate ? new Date(drawingApprovedDate) : null;
          if (drawingStatus !== undefined) {
            updateData.drawingStatus = drawingStatus === "APPROVED"
              ? "COMPLETED"
              : drawingStatus === "REJECTED"
              ? "ON_HOLD"
              : drawingStatus;
          }
          if (drawingRemarks !== undefined) updateData.drawingRemarks = drawingRemarks;
          if (subtotal !== undefined) updateData.subtotal = new Prisma.Decimal(subtotal);
          if (gstTotal !== undefined) updateData.gstTotal = new Prisma.Decimal(gstTotal);
          if (grandTotal !== undefined) updateData.grandTotal = new Prisma.Decimal(grandTotal);
          if (inspectionField !== undefined) updateData.inspectionField = inspectionField;
          if (sendNotification !== undefined) updateData.sendNotification = sendNotification;
          if (remarks !== undefined) updateData.remarks = remarks;

          const updatedOrder = await tx.salesOrder.update({
            where: {
              id,
            },
            data: updateData,
          });

          // ==========================
          // Replace Items (Only if items provided)
          // ==========================

          if (items !== undefined) {
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

            const employeeMap = new Map(employees.map((e) => [e.userId, e.id]));

            const assignments = assignedToId.map((userId) => ({
              salesOrderId: id,
              userId,
              employeeId: employeeMap.get(userId) ?? null,
            }));

            await tx.salesOrderAssignment.createMany({
              data: assignments,
            });
          }

          // Save EAV Custom Field Values if provided
          if ((request.body as any)?.customFields) {
            const { CustomFieldService } = await import("../../../services/customFieldService");
            const cfService = new CustomFieldService(tx as any);
            await cfService.saveValues("order", id, (request.body as any).customFields);
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
