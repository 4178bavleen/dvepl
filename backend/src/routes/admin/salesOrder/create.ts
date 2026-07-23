import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { Prisma } from "@prisma/client";

import { adminLogs } from "../../../services/logger/contextLogger";

import { salesOrderSchema } from "../../../schemas/admin/salesOrder/salesOrder.schema";

async function adminSalesOrderCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Create Sales Order",
        description: "Create new sales order",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ==========================
        // Validate Request
        // ==========================

        const validationResult = salesOrderSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid Sales Order data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid Sales Order data.",
        
              error: validationResult.error.issues,
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

        // ===================================
        // Duplicate DVEPL Code Check
        // ===================================

        const existingOrder = await fastify.prisma.salesOrder.findUnique({
          where: {
            dveplCode,
          },
        });

        if (existingOrder) {
          return reply.status(409).send({
            success: false,
            message: "DVEPL Code already exists.",
          });
        }

        // ===================================
        // Company Validation
        // ===================================

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

        // ===================================
        // Order Taken By Validation
        // ===================================

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

        // ===================================
        // Assigned Users Validation
        // ===================================

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

        // ===================================
        // Calculate Totals
        // ===================================

        let subtotal = 0;
        let gstTotal = 0;
        let grandTotal = 0;

        for (const item of items) {
          const itemAmount = Number(item.quantity) * Number(item.rate);

          const itemGST = 0;

          subtotal += itemAmount;
          gstTotal += itemGST;
        }

        grandTotal = subtotal + gstTotal;

        // ===================================
        // Start Transaction
        // ===================================

        const result = await fastify.prisma.$transaction(async (tx) => {
          // ===================================
          // Create Sales Order
          // ===================================

          const salesOrder = await tx.salesOrder.create({
            data: {
              companyId,
              dveplCode,
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

              // Replace this with your logged-in user id
              createdById: request.user.id,
            },
          });

          // ===================================
          // Create Line Items
          // ===================================

          if (items.length > 0) {
            await tx.salesOrderItem.createMany({
              data: items.map((item) => {
                const itemAmount = Number(item.quantity) * Number(item.rate);

                return {
                  salesOrderId: salesOrder.id,

                  itemCode: item.itemCode,

                  description: item.description,

                  unit: "Nos",

                  quantity: new Prisma.Decimal(item.quantity),

                  unitPrice: new Prisma.Decimal(item.rate),

                  gstPercentage: new Prisma.Decimal(item.gstPercentage),

                  totalPrice: new Prisma.Decimal(itemAmount),

                  remarks: item.remarks ?? null,
                };
              }),
            });
          }

          // ===================================
          // Create Assignments
          // ===================================

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
              salesOrderId: salesOrder.id,
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
          return salesOrder;
        });
        const createdOrder = await fastify.prisma.salesOrder.findUnique({
          where: {
            id: result.id,
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

        adminLogs.info("Sales Order created successfully", {
          salesOrderId: result?.id,
          dveplCode: result?.dveplCode,
          createdBy: (request as any).admin.id,
        });

        // ==========================
        // TODO: Notification
        // ==========================

        if (sendNotification) {
          adminLogs.info("Notification flag enabled.", {
            salesOrderId: result?.id,
          });

          /**
           * Future Implementation
           *
           * Send Email
           * Send WhatsApp
           * Send In-App Notification
           */
        }

        return reply.status(201).send({
          success: true,
          message: "Sales Order created successfully.",
          data: createdOrder,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Sales Order creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating Sales Order.",
          error: error.message,
          stack: error.stack,
        });
      }
    },
  );
}

export default adminSalesOrderCreateRoutes;