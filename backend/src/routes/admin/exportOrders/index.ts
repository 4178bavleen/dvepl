import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import {
  DrawingStatus,
  DrawingType,
  WorkflowStage,
} from "@prisma/client";
import { adminLogs } from "../../../services/logger/contextLogger";
import { z } from "zod";
import { existsSync } from "fs";
import path from "path";
import nodemailer from "nodemailer";

interface Query {
  search?: string;
  status?: string;
  assignedEngineer?: string;
  startDate?: string;
  endDate?: string;
}

const uploadsDirectory = path.join(__dirname, "../../../../uploads");


const DRAWING_STATUS_TRANSITIONS: Record<
  string,
  string[] | null
> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: ["DRAFT", "SUBMITTED"],
  PENDING: null,
  IN_PROGRESS: null,
  COMPLETED: null,
  ON_HOLD: null,
};

const VALID_DRAWING_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "REJECTED",
];

const hasStoredDrawingFile = (fileUrl: string): boolean => {
  if (/^https?:\/\//i.test(fileUrl)) return true;

  if (!fileUrl.startsWith("/uploads/")) return false;

  const fileName = path.basename(fileUrl);

  return (
    fileName !== "." &&
    existsSync(path.join(uploadsDirectory, fileName))
  );
};

async function adminExportOrdersRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  const preHandlers = [fastify.verifyToken];


  const isAdminUser = (admin: any): boolean =>
    Boolean(
      Array.isArray(admin?.roles) &&
        admin.roles.some((roleName: string) =>
          String(roleName).toLowerCase().includes("admin"),
        ),
    );

  const isAssignedToSalesOrder = async (
    salesOrderId: string,
    userId: string,
  ): Promise<boolean> => {
    const assignment =
      await fastify.prisma.salesOrderAssignment.findUnique({
        where: {
          salesOrderId_userId: {
            salesOrderId,
            userId,
          },
        },
      });

    return !!assignment;
  };

  const canManageDrawingOrder = async (
    salesOrderId: string,
    request: FastifyRequest,
  ): Promise<boolean> => {
    const userId = (request.admin as any)?.id;

    if (!userId) return false;

    if (isAdminUser(request.admin)) return true;

    return isAssignedToSalesOrder(salesOrderId, userId);
  };


  const WORKFLOW_STAGE_ORDER: Record<WorkflowStage, number> = {
    ORDER_CONFIRMED: 0,
    PO_READY: 1,
    DRAWING_ASSIGNED: 2,
    DRAWING_SENT: 3,
    REVISION_REQUIRED: 4,
    DRAWING_APPROVED: 5,
    PO_PLACED: 6,
    INVENTORY_FOLLOW_UP: 7,
    PRODUCTION_FOLLOW_UP: 8,
  };

  const WORKFLOW_STAGE_TITLES: Record<string, string> = {
    DRAWING_ASSIGNED: "Drawing Assigned",
    DRAWING_SENT: "Drawing Sent",
    REVISION_REQUIRED: "Revision Required",
    DRAWING_APPROVED: "Drawing Approved",
  };

  const syncSalesOrderWorkflow = async (
    salesOrderId: string,
    stage: WorkflowStage,
    performedById: string | null | undefined,
    description?: string,
  ): Promise<void> => {
    try {
      const order = await fastify.prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        select: { workflowStage: true },
      });

      if (!order) return;

      const currentIndex =
        WORKFLOW_STAGE_ORDER[order.workflowStage] ?? -1;

      const newIndex = WORKFLOW_STAGE_ORDER[stage];

      if (newIndex <= currentIndex) return;

      await fastify.prisma.$transaction([
        fastify.prisma.salesOrder.update({
          where: { id: salesOrderId },
          data: {
            workflowStage: stage,
            workflowUpdatedAt: new Date(),
          },
        }),

        fastify.prisma.workflowEvent.create({
          data: {
            salesOrderId,
            stage,
            title: WORKFLOW_STAGE_TITLES[stage] ?? stage,
            description: description ?? null,
            performedById,
          },
        }),
      ]);
    } catch (error: any) {
      adminLogs.error(
        "Failed to sync sales order workflow from drawing action",
        {
          error,
          salesOrderId,
          stage,
        },
      );
    }
  };


  fastify.get(
    "/read",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Get Sales Orders for Exporting",
        description:
          "Fetch matching sales orders with criteria for export reports",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const {
          search,
          status,
          assignedEngineer,
          startDate,
          endDate,
        } = request.query as Query;

        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized. Company info missing.",
          });
        }

        const where: any = {
          companyId,
          deletedAt: null,
        };

        if (search) {
          where.OR = [
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
          ];
        }

        if (status && status !== "all") {
          where.status = status.toUpperCase();
        }

        if (assignedEngineer) {
          where.assignments = {
            some: {
              user: {
                name: {
                  contains: assignedEngineer,
                  mode: "insensitive",
                },
              },
            },
          };
        }

        if (startDate || endDate) {
          where.createdAt = {};

          if (startDate) {
            where.createdAt.gte = new Date(startDate);
          }

          if (endDate) {
            where.createdAt.lte = new Date(endDate);
          }
        }

        const orders = await fastify.prisma.salesOrder.findMany({
          where,
          include: {
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

            items: true,

            engineeringProjects: {
              where: {
                deletedAt: null,
              },

              include: {
                drawings: {
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.send({
          success: true,
          data: orders,
        });
      } catch (error: any) {
        adminLogs.error("Failed to read export orders", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error reading export orders.",
          error: error.message,
        });
      }
    },
  );


  fastify.get(
    "/drawings",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Get Drawings for selected Sales Orders",
      },

      preHandler: preHandlers,
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orderIds } = request.query as {
          orderIds?: string;
        };

        if (!orderIds) {
          return reply.send({
            success: true,
            data: [],
          });
        }

        const ids = orderIds.split(",").filter(Boolean);

        if (ids.length === 0) {
          return reply.send({
            success: true,
            data: [],
          });
        }

        const drawings =
          await fastify.prisma.engineeringDrawing.findMany({
            where: {
              project: {
                salesOrderId: {
                  in: ids,
                },
                deletedAt: null,
              },

              deletedAt: null,
            },

            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  salesOrderId: true,
                },
              },

              revisions: {
                orderBy: {
                  revisionNo: "desc",
                },

                include: {
                  createdBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },

                  approvedBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },

                  rejectedBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          });

        const drawingsWithCurrentRevision = drawings.map(
          (drawing) => ({
            ...drawing,

            currentRevision:
              drawing.revisions[0] ?? null,

            currentRevisionLabel: drawing.revisions[0]
              ? `R${drawing.revisions[0].revisionNo}`
              : null,
          }),
        );

        return reply.send({
          success: true,
          data: drawingsWithCurrentRevision,
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to fetch drawings for orders",
          { error },
        );

        return reply.status(500).send({
          success: false,
          message: "Server error fetching drawings.",
          error: error.message,
        });
      }
    },
  );


  fastify.get(
    "/next-drawing-no",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Get next available drawing number",
      },

      preHandler: preHandlers,
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const drawings =
          await fastify.prisma.engineeringDrawing.findMany({
            where: {
              deletedAt: null,
            },

            select: {
              drawingNo: true,
            },
          });

        let maxSerial = 0;

        for (const drawing of drawings) {
          const match =
            drawing.drawingNo.match(/^DWG-(\d+)$/i);

          if (match) {
            const number = parseInt(match[1], 10);

            if (number > maxSerial) {
              maxSerial = number;
            }
          }
        }

        const next = `DWG-${String(maxSerial + 1).padStart(
          3,
          "0",
        )}`;

        return reply.send({
          success: true,
          data: next,
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to get next drawing number",
          { error },
        );

        return reply.status(500).send({
          success: false,
          message:
            "Server error getting next drawing number.",
          error: error.message,
        });
      }
    },
  );


  fastify.post(
    "/create-drawing",
    {
      schema: {
        tags: ["Export Orders"],
        summary:
          "Create engineering drawing for a sales order",
      },

      preHandler: preHandlers,
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const bodySchema = z.object({
          salesOrderId: z.string().uuid(),

          drawingNo: z
            .string()
            .trim()
            .min(1),

          title: z
            .string()
            .trim()
            .min(1),

          drawingType:
            z.nativeEnum(DrawingType),

          fileUrl:
            z.string().min(1),

          fileName:
            z.string().trim().min(1),

          fileSize:
            z.number().int().optional().nullable(),

          mimeType:
            z.string().trim().optional().nullable(),
        });

        const validation =
          bodySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validation.error.issues,
          });
        }

        const data = validation.data;

        const companyId =
          request.admin?.companyId;

        const userId =
          request.admin?.id;

        if (!companyId || !userId) {
          return reply.status(401).send({
            success: false,
            message:
              "Unauthorized. Missing token info.",
          });
        }

        const salesOrder =
          await fastify.prisma.salesOrder.findFirst({
            where: {
              id: data.salesOrderId,
              companyId,
              deletedAt: null,
            },
          });

        if (!salesOrder) {
          return reply.status(404).send({
            success: false,
            message:
              "Sales Order not found.",
          });
        }

        if (
          !(await canManageDrawingOrder(
            data.salesOrderId,
            request,
          ))
        ) {
          return reply.status(403).send({
            success: false,
            message:
              "View only: you can only create drawings for sales orders assigned to you.",
          });
        }

        let project =
          await fastify.prisma.engineeringProject.findFirst({
            where: {
              salesOrderId:
                data.salesOrderId,

              companyId,

              deletedAt: null,
            },
          });

        if (!project) {
          project =
            await fastify.prisma.engineeringProject.create({
              data: {
                name: `Project for ${salesOrder.dveplCode}`,

                salesOrderId:
                  data.salesOrderId,

                companyId,

                createdById:
                  userId,
              },
            });
        }

        const existingDrawing =
          await fastify.prisma.engineeringDrawing.findUnique({
            where: {
              drawingNo:
                data.drawingNo,
            },
          });

        if (existingDrawing) {
          return reply.status(409).send({
            success: false,
            message:
              "Drawing number already exists. Please choose a unique reference.",
          });
        }

        const {
          drawing,
          revision,
        } =
          await fastify.prisma.$transaction(
            async (tx) => {
              const drawing =
                await tx.engineeringDrawing.create({
                  data: {
                    projectId:
                      project.id,

                    drawingNo:
                      data.drawingNo,

                    title:
                      data.title,

                    drawingType:
                      data.drawingType,

                    fileUrl:
                      data.fileUrl,

                    fileName:
                      data.fileName,

                    fileSize:
                      data.fileSize,

                    mimeType:
                      data.mimeType,

                    createdById:
                      userId,

                    version: 1,

                    status:
                      DrawingStatus.DRAFT,
                  },
                });

              const revision =
                await tx.drawingRevision.create({
                  data: {
                    drawingId:
                      drawing.id,

                    revisionNo: 0,

                    fileUrl:
                      data.fileUrl,

                    fileName:
                      data.fileName,

                    fileSize:
                      data.fileSize,

                    mimeType:
                      data.mimeType,

                    status:
                      DrawingStatus.DRAFT,

                    createdById:
                      userId,
                  },
                });

              return {
                drawing,
                revision,
              };
            },
          );

        adminLogs.info(
          "Created drawing with initial revision R0",
          {
            drawingId:
              drawing.id,

            revisionId:
              revision.id,
          },
        );

        await syncSalesOrderWorkflow(
          data.salesOrderId,

          WorkflowStage.DRAWING_ASSIGNED,

          userId,

          `Drawing ${drawing.drawingNo} added for order ${salesOrder.dveplCode}`,
        );

        return reply.status(201).send({
          success: true,

          message:
            "Drawing created successfully with revision R0.",

          data: {
            ...drawing,

            currentRevision: {
              ...revision,

              revisionLabel:
                `R${revision.revisionNo}`,
            },
          },
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to create drawing under export orders context",
          {
            error,
          },
        );

        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          error: error.message,
        });
      }
    },
  );
  fastify.put(
    "/drawing/revision/:revisionId/status",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Update drawing revision status",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { revisionId } = request.params as {
          revisionId: string;
        };

        const bodySchema = z.object({
          status: z.enum(["SUBMITTED", "APPROVED", "REJECTED"]),
          rejectionReason: z.string().trim().optional().nullable(),
        });

        const validation = bodySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validation.error.issues,
          });
        }

        const { status, rejectionReason } = validation.data;

        const companyId = request.admin?.companyId;
        const userId = request.admin?.id;

        if (!companyId || !userId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized. Missing token info.",
          });
        }

        const revision =
          await fastify.prisma.drawingRevision.findFirst({
            where: {
              id: revisionId,
              drawing: {
                deletedAt: null,
                project: {
                  companyId,
                  deletedAt: null,
                },
              },
            },
            include: {
              drawing: {
                include: {
                  project: {
                    select: {
                      salesOrderId: true,
                    },
                  },
                },
              },
            },
          });

        if (!revision) {
          return reply.status(404).send({
            success: false,
            message: "Drawing revision not found.",
          });
        }

        const drawing = revision.drawing;
        const salesOrderId = drawing.project?.salesOrderId;

        if (!salesOrderId) {
          return reply.status(400).send({
            success: false,
            message: "Drawing is not linked to a sales order.",
          });
        }

        if (!(await canManageDrawingOrder(salesOrderId, request))) {
          return reply.status(403).send({
            success: false,
            message:
              "View only: you can only manage revisions for sales orders assigned to you.",
          });
        }

        const currentStatus = revision.status;

        const allowedTransitions: Record<
          string,
          string[]
        > = {
          DRAFT: ["SUBMITTED"],
          SUBMITTED: ["APPROVED", "REJECTED"],
          APPROVED: [],
          REJECTED: ["DRAFT", "SUBMITTED"],
        };

        const allowedTargets =
          allowedTransitions[currentStatus] ?? [];

        if (!allowedTargets.includes(status)) {
          return reply.status(400).send({
            success: false,
            message: `Invalid revision transition from ${currentStatus} to ${status}.`,
          });
        }

        if (
          status === "REJECTED" &&
          !rejectionReason?.trim()
        ) {
          return reply.status(400).send({
            success: false,
            message: "Rejection reason is required.",
          });
        }

        const revisionUpdate: any = {
          status,
        };

        if (status === "SUBMITTED") {
          revisionUpdate.submittedAt = new Date();

          revisionUpdate.rejectionReason = null;
          revisionUpdate.rejectedById = null;
          revisionUpdate.rejectedAt = null;
        }

        if (status === "APPROVED") {
          revisionUpdate.approvedById = userId;
          revisionUpdate.approvedAt = new Date();

          revisionUpdate.rejectionReason = null;
          revisionUpdate.rejectedById = null;
          revisionUpdate.rejectedAt = null;
        }

        if (status === "REJECTED") {
          revisionUpdate.rejectionReason =
            rejectionReason!.trim();
          revisionUpdate.rejectedById = userId;
          revisionUpdate.rejectedAt = new Date();

          revisionUpdate.approvedById = null;
          revisionUpdate.approvedAt = null;
        }

        const updatedRevision =
          await fastify.prisma.$transaction(async (tx) => {
            const updatedRevision =
              await tx.drawingRevision.update({
                where: {
                  id: revisionId,
                },
                data: revisionUpdate,
                include: {
                  createdBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  approvedBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  rejectedBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              });

            await tx.engineeringDrawing.update({
              where: {
                id: drawing.id,
              },
              data: {
                status,
                fileUrl: updatedRevision.fileUrl,
                fileName: updatedRevision.fileName,
                fileSize: updatedRevision.fileSize,
                mimeType: updatedRevision.mimeType,

                ...(status === "APPROVED"
                  ? {
                      approvedById: userId,
                      approvedAt: new Date(),
                      rejectionReason: null,
                    }
                  : {}),

                ...(status === "REJECTED"
                  ? {
                      approvedById: null,
                      approvedAt: null,
                      rejectionReason:
                        rejectionReason!.trim(),
                    }
                  : {}),

                ...(status === "SUBMITTED"
                  ? {
                      approvedById: null,
                      approvedAt: null,
                      rejectionReason: null,
                    }
                  : {}),
              },
            });

            return updatedRevision;
          });

        if (status === "SUBMITTED") {
          await syncSalesOrderWorkflow(
            salesOrderId,
            WorkflowStage.DRAWING_SENT,
            userId,
            `Revision R${updatedRevision.revisionNo} submitted for drawing ${drawing.drawingNo}`,
          );
        }

        if (status === "APPROVED") {
          await syncSalesOrderWorkflow(
            salesOrderId,
            WorkflowStage.DRAWING_APPROVED,
            userId,
            `Revision R${updatedRevision.revisionNo} approved for drawing ${drawing.drawingNo}`,
          );
        }

        if (status === "REJECTED") {
          await syncSalesOrderWorkflow(
            salesOrderId,
            WorkflowStage.REVISION_REQUIRED,
            userId,
            `Revision R${updatedRevision.revisionNo} rejected for drawing ${drawing.drawingNo}: ${rejectionReason!.trim()}`,
          );
        }

        adminLogs.info("Updated drawing revision status", {
          revisionId,
          drawingId: drawing.id,
          revisionNo: updatedRevision.revisionNo,
          status,
        });

        return reply.send({
          success: true,
          message: `Revision R${updatedRevision.revisionNo} ${status.toLowerCase()} successfully.`,
          data: {
            ...updatedRevision,
            revisionLabel: `R${updatedRevision.revisionNo}`,
          },
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to update drawing revision status",
          { error },
        );

        return reply.status(500).send({
          success: false,
          message: "Server error updating drawing revision status.",
          error: error.message,
        });
      }
    },
  );


  fastify.put(
    "/drawing/update/:id",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Update drawing status",
      },

      preHandler: preHandlers,
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      try {
        const { id } =
          request.params as {
            id: string;
          };

        const bodySchema = z.object({
          status:
            z.string().trim().min(1),

          rejectionReason:
            z.string().trim().optional().nullable(),
        });

        const validation =
          bodySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message:
              "Invalid request data.",

            error:
              validation.error.issues,
          });
        }

        const {
          status: rawStatus,
          rejectionReason,
        } = validation.data;

        const status =
          rawStatus.toUpperCase();

        if (
          !VALID_DRAWING_STATUSES.includes(
            status,
          )
        ) {
          return reply.status(400).send({
            success: false,

            message:
              `Invalid status. Must be one of: ${VALID_DRAWING_STATUSES.join(", ")}`,
          });
        }

        const companyId =
          request.admin?.companyId;

        const userId =
          request.admin?.id;

        if (!companyId || !userId) {
          return reply.status(401).send({
            success: false,
            message:
              "Unauthorized. Missing token info.",
          });
        }

        const drawing =
          await fastify.prisma.engineeringDrawing.findFirst({
            where: {
              id,

              project: {
                companyId,

                deletedAt: null,
              },
            },

            include: {
              project: {
                select: {
                  salesOrderId: true,
                },
              },

              revisions: {
                orderBy: {
                  revisionNo: "desc",
                },

                take: 1,
              },
            },
          });

        if (!drawing) {
          return reply.status(404).send({
            success: false,
            message:
              "Drawing not found.",
          });
        }

        const salesOrderId =
          drawing.project?.salesOrderId;

        if (!salesOrderId) {
          return reply.status(400).send({
            success: false,
            message:
              "Drawing is not linked to a sales order.",
          });
        }

        if (
          !(await canManageDrawingOrder(
            salesOrderId,
            request,
          ))
        ) {
          return reply.status(403).send({
            success: false,

            message:
              "View only: you can only manage drawings for sales orders assigned to you.",
          });
        }

        const currentStatus =
          drawing.status;

        if (status === currentStatus) {
          return reply.send({
            success: true,

            message:
              "Drawing status is already set.",

            data: {
              ...drawing,

              currentRevision:
                drawing.revisions[0] ??
                null,
            },
          });
        }

        const allowedTargets =
          DRAWING_STATUS_TRANSITIONS[
            currentStatus
          ];

        if (
          allowedTargets &&
          !allowedTargets.includes(status)
        ) {
          return reply.status(400).send({
            success: false,

            message:
              `Invalid transition from ${currentStatus} to ${status}.`,
          });
        }

        if (
          status === "REJECTED" &&
          currentStatus === "SUBMITTED" &&
          !rejectionReason?.trim()
        ) {
          return reply.status(400).send({
            success: false,

            message:
              "Rejection reason is required.",
          });
        }

        const currentRevision =
          drawing.revisions[0];

        if (!currentRevision) {
          return reply.status(409).send({
            success: false,

            message:
              "Drawing has no revision record. Please repair the drawing before changing its status.",
          });
        }

        const now = new Date();

        const result =
          await fastify.prisma.$transaction(
            async (tx) => {
              const drawingUpdateData: any = {
                status,
              };

              const revisionUpdateData: any = {
                status,
              };

              if (status === "APPROVED") {
                drawingUpdateData.approvedById =
                  userId;

                drawingUpdateData.approvedAt =
                  now;

                drawingUpdateData.rejectionReason =
                  null;

                revisionUpdateData.approvedById =
                  userId;

                revisionUpdateData.approvedAt =
                  now;

                revisionUpdateData.rejectionReason =
                  null;

                revisionUpdateData.rejectedById =
                  null;

                revisionUpdateData.rejectedAt =
                  null;
              }

              if (status === "REJECTED") {
                const reason =
                  rejectionReason?.trim() ||
                  null;

                drawingUpdateData.rejectionReason =
                  reason;

                drawingUpdateData.approvedById =
                  null;

                drawingUpdateData.approvedAt =
                  null;

                revisionUpdateData.rejectionReason =
                  reason;

                revisionUpdateData.rejectedById =
                  userId;

                revisionUpdateData.rejectedAt =
                  now;

                revisionUpdateData.approvedById =
                  null;

                revisionUpdateData.approvedAt =
                  null;
              }

              if (status === "SUBMITTED") {
                drawingUpdateData.rejectionReason =
                  null;

                revisionUpdateData.rejectionReason =
                  null;

                revisionUpdateData.submittedAt =
                  currentRevision.submittedAt ??
                  now;

                revisionUpdateData.rejectedById =
                  null;

                revisionUpdateData.rejectedAt =
                  null;
              }

              if (status === "DRAFT") {
                drawingUpdateData.rejectionReason =
                  null;

                drawingUpdateData.approvedById =
                  null;

                drawingUpdateData.approvedAt =
                  null;

                revisionUpdateData.rejectionReason =
                  null;

                revisionUpdateData.approvedById =
                  null;

                revisionUpdateData.approvedAt =
                  null;

                revisionUpdateData.rejectedById =
                  null;

                revisionUpdateData.rejectedAt =
                  null;
              }

              const updatedDrawing =
                await tx.engineeringDrawing.update({
                  where: {
                    id,
                  },

                  data:
                    drawingUpdateData,
                });

              const updatedRevision =
                await tx.drawingRevision.update({
                  where: {
                    id: currentRevision.id,
                  },

                  data:
                    revisionUpdateData,

                  include: {
                    createdBy: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },

                    approvedBy: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },

                    rejectedBy: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });

              return {
                drawing:
                  updatedDrawing,

                revision:
                  updatedRevision,
              };
            },
          );

        if (status === "APPROVED") {
          await syncSalesOrderWorkflow(
            salesOrderId,

            WorkflowStage.DRAWING_APPROVED,

            userId,

            `Drawing ${result.drawing.drawingNo} ${`R${result.revision.revisionNo}`} approved`,
          );
        }

        if (status === "REJECTED") {
          await syncSalesOrderWorkflow(
            salesOrderId,

            WorkflowStage.REVISION_REQUIRED,

            userId,

            `Drawing ${result.drawing.drawingNo} R${result.revision.revisionNo} rejected: ${
              rejectionReason?.trim() ||
              "revision required"
            }`,
          );
        }

        return reply.send({
          success: true,

          message:
            `Drawing R${result.revision.revisionNo} status updated successfully.`,

          data: {
            ...result.drawing,

            currentRevision: {
              ...result.revision,

              revisionLabel:
                `R${result.revision.revisionNo}`,
            },
          },
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to update drawing status",
          {
            error,
          },
        );

        return reply.status(500).send({
          success: false,

          message:
            "Server error updating drawing status.",

          error:
            error.message,
        });
      }
    },
  );


  // Upload a revised drawing after rejection.
  // Creates R1, R2, ... on the existing EngineeringDrawing.
  fastify.post(
    "/drawing/:id/revision",
    {
      schema: {
        tags: ["Export Orders"],
        summary:
          "Upload a revised engineering drawing",
      },

      preHandler: preHandlers,
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      try {
        const { id } =
          request.params as {
            id: string;
          };

        const bodySchema = z.object({
          fileUrl:
            z.string().min(1),

          fileName:
            z.string().trim().min(1),

          fileSize:
            z.number().int().optional().nullable(),

          mimeType:
            z.string().trim().optional().nullable(),

          changes:
            z.string().trim().optional().nullable(),

          title:
            z.string().trim().min(1).optional(),

          drawingType:
            z.nativeEnum(DrawingType).optional(),
        });

        const validation =
          bodySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,

            message:
              "Invalid revision data.",

            error:
              validation.error.issues,
          });
        }

        const data =
          validation.data;

        const companyId =
          request.admin?.companyId;

        const userId =
          request.admin?.id;

        if (!companyId || !userId) {
          return reply.status(401).send({
            success: false,

            message:
              "Unauthorized. Missing token info.",
          });
        }

        const drawing =
          await fastify.prisma.engineeringDrawing.findFirst({
            where: {
              id,

              project: {
                companyId,

                deletedAt: null,
              },

              deletedAt: null,
            },

            include: {
              project: {
                select: {
                  salesOrderId: true,
                },
              },

              revisions: {
                orderBy: {
                  revisionNo: "desc",
                },

                take: 1,
              },
            },
          });

        if (!drawing) {
          return reply.status(404).send({
            success: false,

            message:
              "Drawing not found.",
          });
        }

        const salesOrderId =
          drawing.project?.salesOrderId;

        if (!salesOrderId) {
          return reply.status(400).send({
            success: false,

            message:
              "Drawing is not linked to a sales order.",
          });
        }

        if (
          !(await canManageDrawingOrder(
            salesOrderId,
            request,
          ))
        ) {
          return reply.status(403).send({
            success: false,

            message:
              "View only: you can only create revisions for sales orders assigned to you.",
          });
        }

        // A new revision is uploaded only after the current drawing has
        // been rejected. The same drawing number is retained and the new
        // revision becomes the current DRAFT revision.
        if (drawing.status !== DrawingStatus.REJECTED) {
          return reply.status(400).send({
            success: false,

            message:
              "A new revision can only be uploaded after the current drawing has been rejected.",
          });
        }

        if (!hasStoredDrawingFile(data.fileUrl)) {
          return reply.status(400).send({
            success: false,

            message:
              "Drawing file was not found or is not a valid stored file URL.",
          });
        }

        const latestRevision =
          drawing.revisions[0];

        const nextRevisionNo =
          latestRevision
            ? latestRevision.revisionNo + 1
            : 0;

        const {
          revision,
          updatedDrawing,
        } =
          await fastify.prisma.$transaction(
            async (tx) => {
              const revision =
                await tx.drawingRevision.create({
                  data: {
                    drawingId:
                      drawing.id,

                    revisionNo:
                      nextRevisionNo,

                    fileUrl:
                      data.fileUrl,

                    fileName:
                      data.fileName,

                    fileSize:
                      data.fileSize,

                    mimeType:
                      data.mimeType,

                    changes:
                      data.changes?.trim() ||
                      null,

                    status:
                      DrawingStatus.DRAFT,

                    createdById:
                      userId,
                  },

                  include: {
                    createdBy: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                });

              const updatedDrawing =
                await tx.engineeringDrawing.update({
                  where: {
                    id: drawing.id,
                  },

                  data: {
                    fileUrl:
                      data.fileUrl,

                    fileName:
                      data.fileName,

                    fileSize:
                      data.fileSize,

                    mimeType:
                      data.mimeType,

                    ...(data.title
                      ? {
                          title:
                            data.title,
                        }
                      : {}),

                    ...(data.drawingType
                      ? {
                          drawingType:
                            data.drawingType,
                        }
                      : {}),

                    version:
                      nextRevisionNo + 1,

                    status:
                      DrawingStatus.DRAFT,

                    rejectionReason:
                      null,

                    approvedById:
                      null,

                    approvedAt:
                      null,
                  },
                });

              return {
                revision,
                updatedDrawing,
              };
            },
          );

        adminLogs.info(
          "Created new drawing revision",
          {
            drawingId:
              drawing.id,

            revisionId:
              revision.id,

            revisionNo:
              revision.revisionNo,

            createdById:
              userId,
          },
        );

        return reply.status(201).send({
          success: true,

          message:
            `Drawing revision R${revision.revisionNo} created successfully.`,

          data: {
            ...updatedDrawing,

            currentRevision: {
              ...revision,

              revisionLabel:
                `R${revision.revisionNo}`,
            },
          },
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to create drawing revision",
          {
            error,
          },
        );

        return reply.status(500).send({
          success: false,

          message:
            "Server error creating drawing revision.",

          error:
            error.message,
        });
      }
    },
  );


  fastify.post(
    "/drawing/send",
    {
      schema: {
        tags: ["Export Orders"],
        summary:
          "Send drawing via Email / WhatsApp",
      },

      preHandler: preHandlers,
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      try {
        const bodySchema = z.object({
          drawingId:
            z.string().uuid(),

          method:
            z.enum([
              "EMAIL",
              "WHATSAPP",
              "BOTH",
            ]),

          email:
            z.string().email().optional().nullable(),

          phone:
            z.string().optional().nullable(),

          subject:
            z.string().optional().nullable(),

          message:
            z.string().optional().nullable(),
        });

        const validation =
          bodySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,

            message:
              "Invalid request data.",

            error:
              validation.error.issues,
          });
        }

        const {
          drawingId,
          method,
          email,
          phone,
          subject,
          message,
        } = validation.data;

        const companyId =
          request.admin?.companyId;

        const userId =
          request.admin?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,

            message:
              "Unauthorized. Missing company info.",
          });
        }

        const drawing =
          await fastify.prisma.engineeringDrawing.findFirst({
            where: {
              id: drawingId,

              project: {
                companyId,
              },
            },

            include: {
              project: {
                include: {
                  salesOrder: {
                    include: {
                      customer: {
                        include: {
                          contacts: true,
                        },
                      },
                    },
                  },
                },
              },

              revisions: {
                orderBy: {
                  revisionNo: "desc",
                },

                take: 1,
              },
            },
          });

        if (!drawing) {
          return reply.status(404).send({
            success: false,

            message:
              "Drawing not found.",
          });
        }

        const salesOrderId =
          drawing.project?.salesOrderId;

        if (
          !salesOrderId ||
          !(await canManageDrawingOrder(
            salesOrderId,
            request,
          ))
        ) {
          return reply.status(403).send({
            success: false,

            message:
              "View only: you can only send drawings for sales orders assigned to you.",
          });
        }

        const salesOrder =
          drawing.project?.salesOrder;

        const latestRevision =
          drawing.revisions[0] ?? null;

        const fileUrl =
          latestRevision?.fileUrl ??
          drawing.fileUrl;

        const fileName =
          latestRevision?.fileName ??
          drawing.fileName;

        const revisionLabel =
          latestRevision
            ? `R${latestRevision.revisionNo}`
            : `R${Math.max(
                (drawing.version ?? 1) - 1,
                0,
              )}`;

        let targetEmail = email;
        let targetPhone = phone;

        if (!targetEmail || !targetPhone) {
          if (salesOrder?.contactDetails) {
            const parts =
              salesOrder.contactDetails
                .split("|")
                .map((p) => p.trim());

            if (parts.length >= 3) {
              if (
                !targetEmail &&
                parts[2]?.includes("@")
              ) {
                targetEmail = parts[2];
              }

              if (!targetPhone) {
                targetPhone = parts[1];
              }
            } else {
              for (const part of parts) {
                if (
                  !targetEmail &&
                  part.includes("@")
                ) {
                  targetEmail = part;
                }

                if (
                  !targetPhone &&
                  /^[+\d\s-]{10,20}$/.test(
                    part,
                  )
                ) {
                  targetPhone = part;
                }
              }
            }
          }

          if (
            salesOrder?.customer?.contacts
          ) {
            const primaryContact =
              salesOrder.customer.contacts.find(
                (c) => c.isPrimary,
              ) ||
              salesOrder.customer.contacts[0];

            if (primaryContact) {
              if (
                !targetEmail &&
                primaryContact.email
              ) {
                targetEmail =
                  primaryContact.email;
              }

              if (
                !targetPhone &&
                primaryContact.phone
              ) {
                targetPhone =
                  primaryContact.phone;
              }
            }
          }
        }

        const defaultSubject =
          subject ||
          `Engineering Drawing for Order ${
            salesOrder?.dveplCode || ""
          }: ${drawing.drawingNo} ${revisionLabel}`;

        const defaultMessage =
          message ||
          `Dear Customer,

Please find attached the engineering drawing: ${drawing.title} (${drawing.drawingNo}) ${revisionLabel} for your order ${
            salesOrder?.dveplCode || ""
          }.

Best Regards,
DVEPL Team`;

        let emailSent = false;
        let whatsappLink = "";

        const host =
          request.headers.host ||
          "localhost:8000";

        const protocol =
          (request.raw as any).socket
            ?.encrypted
            ? "https"
            : "http";

        const apiBaseUrl =
          `${protocol}://${host}`;


        if (
          (method === "EMAIL" ||
            method === "BOTH") &&
          targetEmail
        ) {
          const attachmentOptions: any[] =
            [];

          if (fileUrl) {
            if (
              /^https?:\/\//i.test(
                fileUrl,
              )
            ) {
              attachmentOptions.push({
                filename: fileName,
                path: fileUrl,
              });
            } else {
              const storedFileName =
                path.basename(fileUrl);

              const filePath =
                path.join(
                  uploadsDirectory,
                  storedFileName,
                );

              if (existsSync(filePath)) {
                attachmentOptions.push({
                  filename: fileName,
                  path: filePath,
                });
              }
            }
          }

          const dbConfig =
            await fastify.prisma.notificationConfiguration.findUnique(
              {
                where: {
                  companyId,
                },
              },
            );

          const savedSettings =
            (
              await fastify.prisma.companySettings.findUnique(
                {
                  where: {
                    companyId,
                  },
                },
              )
            )?.data as any;

          const settings =
            savedSettings || {};

          const savedSmtp =
            settings.smtpSettings || {};

          const smtpHost =
            dbConfig?.smtpHost ||
            savedSmtp.host;

          const smtpPort =
            dbConfig?.smtpPort ||
            savedSmtp.port;

          const smtpUsername =
            dbConfig?.smtpUsername ||
            savedSmtp.username ||
            savedSmtp.email;

          const smtpPassword =
            dbConfig?.smtpPassword ||
            savedSmtp.password;

          const smtpFromEmail =
            dbConfig?.smtpFromEmail ||
            settings.emailSettings?.address ||
            smtpUsername;

          const smtpFromName =
            dbConfig?.smtpFromName ||
            savedSmtp.title ||
            settings.emailSettings?.name;

          if (!smtpHost || !smtpPort) {
            return reply.status(400).send({
              success: false,

              message:
                "SMTP host and port must be configured before sending a drawing email.",
            });
          }

          const parsedPort =
            parseInt(
              String(smtpPort),
              10,
            );

          const transporter =
            nodemailer.createTransport({
              host: smtpHost,

              port: parsedPort,

              secure:
                parsedPort === 465,

              auth:
                smtpUsername &&
                smtpPassword
                  ? {
                      user:
                        smtpUsername,

                      pass:
                        smtpPassword,
                    }
                  : undefined,

              connectionTimeout:
                10000,
            });

          await transporter.sendMail({
            from: `"${smtpFromName || "DVEPL"}" <${
              smtpFromEmail ||
              "no-reply@dvepl.com"
            }>`,
            to: targetEmail,

            subject:
              defaultSubject,

            html:
              defaultMessage.replace(
                /\n/g,
                "<br>",
              ),

            attachments:
              attachmentOptions,
          });

          emailSent = true;

          adminLogs.info(
            "Drawing email sent successfully",
            {
              drawingId,
              revisionId:
                latestRevision?.id ??
                null,

              revisionNo:
                latestRevision?.revisionNo ??
                null,

              to: targetEmail,
            },
          );
        }


        if (
          method === "WHATSAPP" ||
          method === "BOTH"
        ) {
          const rawPhone =
            targetPhone
              ? targetPhone.replace(
                  /\D/g,
                  "",
                )
              : "";

          const drawingLink =
            /^https?:\/\//i.test(
              fileUrl,
            )
              ? fileUrl
              : `${apiBaseUrl}${fileUrl}`;

          const text =
            encodeURIComponent(
              `${defaultSubject}

${defaultMessage}

Drawing Link: ${drawingLink}`,
            );

          if (rawPhone) {
            whatsappLink =
              `https://wa.me/${rawPhone}?text=${text}`;
          }
        }

        if (
          emailSent ||
          whatsappLink
        ) {
          await syncSalesOrderWorkflow(
            salesOrderId,

            WorkflowStage.DRAWING_SENT,

            userId,

            `Drawing ${drawing.drawingNo} ${revisionLabel} sent to customer via ${method}`,
          );
        }

        return reply.send({
          success: true,

          message:
            "Action processed successfully.",

          data: {
            emailSent,

            whatsappLink,

            recipientEmail:
              targetEmail || null,

            recipientPhone:
              targetPhone || null,

            revisionId:
              latestRevision?.id ??
              null,

            revisionNo:
              latestRevision?.revisionNo ??
              null,

            revisionLabel,
          },
        });
      } catch (error: any) {
        adminLogs.error(
          "Failed to send drawing",
          {
            error,
          },
        );

        return reply.status(500).send({
          success: false,

          message:
            "Failed to process send action.",

          error:
            error.message,
        });
      }
    },
  );


  fastify.get(
    "/drawing/:id/revisions",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Get all revisions for an engineering drawing",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id: drawingId } = request.params as { id: string };
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized. Missing company info.",
          });
        }

        const drawing = await fastify.prisma.engineeringDrawing.findFirst({
          where: {
            id: drawingId,
            deletedAt: null,
            project: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            project: {
              select: {
                salesOrderId: true,
              },
            },
          },
        });

        if (!drawing) {
          return reply.status(404).send({
            success: false,
            message: "Drawing not found.",
          });
        }

        const salesOrderId = drawing.project?.salesOrderId;

        if (
          !salesOrderId ||
          !(await canManageDrawingOrder(salesOrderId, request))
        ) {
          return reply.status(403).send({
            success: false,
            message:
              "View only: you can only view revisions for sales orders assigned to you.",
          });
        }

        const revisions = await fastify.prisma.drawingRevision.findMany({
          where: {
            drawingId,
          },
          orderBy: {
            revisionNo: "desc",
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            rejectedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return reply.send({
          success: true,
          data: revisions.map((revision) => ({
            ...revision,
            revisionLabel: `R${revision.revisionNo}`,
          })),
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch drawing revisions", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error fetching drawing revisions.",
          error: error.message,
        });
      }
    },
  );
}

export default adminExportOrdersRouteGroup;
