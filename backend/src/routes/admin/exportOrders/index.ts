import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { DrawingStatus, DrawingType, WorkflowStage } from "@prisma/client";
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

// Workflow transition map. Legacy statuses (PENDING, IN_PROGRESS, COMPLETED,
// ON_HOLD) remain free-form for backward compatibility (null = any target allowed).
const DRAWING_STATUS_TRANSITIONS: Record<string, string[] | null> = {
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
  // A remote URL cannot be verified on the application filesystem, so leave it
  // available. Locally uploaded drawings must resolve to an existing file.
  if (/^https?:\/\//i.test(fileUrl)) return true;
  if (!fileUrl.startsWith("/uploads/")) return false;

  const fileName = path.basename(fileUrl);
  return fileName !== "." && existsSync(path.join(uploadsDirectory, fileName));
};

async function adminExportOrdersRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Pre-handler hook for verification
  const preHandlers = [fastify.verifyToken];

  // ============================================================
  // Assignment-aware access helpers
  // ============================================================
  const isAdminUser = (admin: any): boolean =>
    Boolean(
      Array.isArray(admin?.roles) &&
        admin.roles.some((roleName: string) =>
          String(roleName).toLowerCase().includes("admin")
        )
    );

  const isAssignedToSalesOrder = async (
    salesOrderId: string,
    userId: string
  ): Promise<boolean> => {
    const assignment = await fastify.prisma.salesOrderAssignment.findUnique({
      where: { salesOrderId_userId: { salesOrderId, userId } },
    });
    return !!assignment;
  };

  const canManageDrawingOrder = async (
    salesOrderId: string,
    request: FastifyRequest
  ): Promise<boolean> => {
    const userId = (request.admin as any)?.id;
    if (!userId) return false;
    if (isAdminUser(request.admin)) return true;
    return isAssignedToSalesOrder(salesOrderId, userId);
  };

  // ============================================================
  // Workflow tracker sync
  // ============================================================
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

  // Advance the sales order's workflow stage + log an event. The stage only
  // ever moves forward (never regresses) so drawing activity reflects the
  // furthest point reached in the workflow tracker. Best-effort so a failure
  // here never breaks the drawing operation itself.
  const syncSalesOrderWorkflow = async (
    salesOrderId: string,
    stage: WorkflowStage,
    performedById: string | null | undefined,
    description?: string
  ): Promise<void> => {
    try {
      const order = await fastify.prisma.salesOrder.findUnique({
        where: { id: salesOrderId },
        select: { workflowStage: true },
      });
      if (!order) return;

      const currentIndex = WORKFLOW_STAGE_ORDER[order.workflowStage] ?? -1;
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
      adminLogs.error("Failed to sync sales order workflow from drawing action", { error, salesOrderId, stage });
    }
  };

  // 1. Get Matching Sales Orders with filters
  fastify.get(
    "/read",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Get Sales Orders for Exporting",
        description: "Fetch matching sales orders with criteria for export reports",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { search, status, assignedEngineer, startDate, endDate } =
          (request.query as Query);
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
            { dveplCode: { contains: search, mode: "insensitive" } },
            { partyName: { contains: search, mode: "insensitive" } },
          ];
        }

        if (status && status !== "all") {
          // Normalize status
          where.status = status.toUpperCase();
        }

        if (assignedEngineer) {
          where.assignments = {
            some: {
              user: {
                name: { contains: assignedEngineer, mode: "insensitive" },
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
                  select: { id: true, name: true, email: true },
                },
              },
            },
            items: true,
            engineeringProjects: {
              where: { deletedAt: null },
              include: {
                drawings: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({
          success: true,
          data: orders,
        });
      } catch (error: any) {
        adminLogs.error("Failed to read export orders", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error reading export orders.",
          error: error.message,
        });
      }
    }
  );

  // 2. Read drawings for specific sales order IDs
  interface DrawingsQuery { orderIds?: string; }
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
        const { orderIds } = (request.query as { orderIds?: string });
        if (!orderIds) {
          return reply.send({ success: true, data: [] });
        }

        const ids = orderIds.split(",").filter(Boolean);
        if (ids.length === 0) {
          return reply.send({ success: true, data: [] });
        }

        const drawings = await fastify.prisma.engineeringDrawing.findMany({
          where: {
            project: {
              salesOrderId: { in: ids },
              deletedAt: null,
            },
            deletedAt: null,
          },
          include: {
            project: {
              select: { id: true, name: true, salesOrderId: true },
            },
          },
        });

        return reply.send({ success: true, data: drawings });
      } catch (error: any) {
        adminLogs.error("Failed to fetch drawings for orders", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error fetching drawings.",
          error: error.message,
        });
      }
    }
  );

  // 3. Get next available drawing number in serial (DWG-001, DWG-002, ...)
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
        // Find all drawingNo values that match the DWG-NNN pattern
        const drawings = await fastify.prisma.engineeringDrawing.findMany({
          where: { deletedAt: null },
          select: { drawingNo: true },
        });

        let maxSerial = 0;
        for (const d of drawings) {
          const match = d.drawingNo.match(/^DWG-(\d+)$/i);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxSerial) maxSerial = n;
          }
        }

        const next = `DWG-${String(maxSerial + 1).padStart(3, "0")}`;
        return reply.send({ success: true, data: next });
      } catch (error: any) {
        adminLogs.error("Failed to get next drawing number", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error getting next drawing number.",
          error: error.message,
        });
      }
    }
  );

  // 4. Create engineering drawing associated with sales order
  fastify.post(
    "/create-drawing",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Create engineering drawing for a sales order",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const bodySchema = z.object({
          salesOrderId: z.string().uuid(),
          drawingNo: z.string().trim().min(1),
          title: z.string().trim().min(1),
          drawingType: z.nativeEnum(DrawingType),
          fileUrl: z.string().min(1),
          fileName: z.string().trim().min(1),
          fileSize: z.number().int().optional().nullable(),
          mimeType: z.string().trim().optional().nullable(),
        });

        const validation = bodySchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validation.error.issues,
          });
        }

        const data = validation.data;
        const companyId = request.admin?.companyId;
        const userId = request.admin?.id;

        if (!companyId || !userId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized. Missing token info.",
          });
        }

        // Get Sales Order
        const salesOrder = await fastify.prisma.salesOrder.findFirst({
          where: { id: data.salesOrderId, companyId, deletedAt: null },
        });

        if (!salesOrder) {
          return reply.status(404).send({
            success: false,
            message: "Sales Order not found.",
          });
        }

        if (!(await canManageDrawingOrder(data.salesOrderId, request))) {
          return reply.status(403).send({
            success: false,
            message: "View only: you can only create drawings for sales orders assigned to you.",
          });
        }

        // Find or create EngineeringProject linked to this Sales Order
        let project = await fastify.prisma.engineeringProject.findFirst({
          where: { salesOrderId: data.salesOrderId, companyId, deletedAt: null },
        });

        if (!project) {
          project = await fastify.prisma.engineeringProject.create({
            data: {
              name: `Project for ${salesOrder.dveplCode}`,
              salesOrderId: data.salesOrderId,
              companyId,
              createdById: userId,
            },
          });
        }

        // Check if drawing number exists
        const existingDrawing = await fastify.prisma.engineeringDrawing.findUnique({
          where: { drawingNo: data.drawingNo },
        });

        if (existingDrawing) {
          return reply.status(409).send({
            success: false,
            message: "Drawing number already exists. Please choose a unique reference.",
          });
        }

        // Create the drawing
        const drawing = await fastify.prisma.engineeringDrawing.create({
          data: {
            projectId: project.id,
            drawingNo: data.drawingNo,
            title: data.title,
            drawingType: data.drawingType,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            createdById: userId,
            status: DrawingStatus.DRAFT,
          },
        });

        adminLogs.info("Created drawing for sales order export context", { drawingId: drawing.id });

        await syncSalesOrderWorkflow(
          data.salesOrderId,
          WorkflowStage.DRAWING_ASSIGNED,
          userId,
          `Drawing ${drawing.drawingNo} added for order ${salesOrder.dveplCode}`
        );

        return reply.status(201).send({
          success: true,
          message: "Drawing created successfully.",
          data: drawing,
        });
      } catch (error: any) {
        adminLogs.error("Failed to create drawing under export orders context", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          error: error.message,
        });
      }
    }
  );

  // 5. Update drawing status / review workflow (DRAFT -> SUBMITTED -> APPROVED / REJECTED)
  fastify.put(
    "/drawing/update/:id",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Update drawing status",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const bodySchema = z.object({
          status: z.string().trim().min(1),
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

        const { status: rawStatus, rejectionReason } = validation.data;
        const status = rawStatus.toUpperCase();

        if (!VALID_DRAWING_STATUSES.includes(status)) {
          return reply.status(400).send({
            success: false,
            message: `Invalid status. Must be one of: ${VALID_DRAWING_STATUSES.join(", ")}`,
          });
        }

        const companyId = (request.admin as any)?.companyId;
        const userId = (request.admin as any)?.id;
        if (!companyId || !userId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized. Missing token info.",
          });
        }

        const drawing = await fastify.prisma.engineeringDrawing.findFirst({
          where: { id, project: { companyId, deletedAt: null } },
          include: { project: { select: { salesOrderId: true } } },
        });

        if (!drawing) {
          return reply.status(404).send({
            success: false,
            message: "Drawing not found.",
          });
        }

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
            message: "View only: you can only manage drawings for sales orders assigned to you.",
          });
        }

        const currentStatus = drawing.status;

        if (status === currentStatus) {
          return reply.send({
            success: true,
            message: "Drawing status is already set.",
            data: drawing,
          });
        }

        // Enforce the review workflow for workflow statuses.
        const allowedTargets = DRAWING_STATUS_TRANSITIONS[currentStatus];
        if (allowedTargets && !allowedTargets.includes(status)) {
          return reply.status(400).send({
            success: false,
            message: `Invalid transition from ${currentStatus} to ${status}.`,
          });
        }

        // Rejection within the review workflow requires a reason.
        if (status === "REJECTED" && currentStatus === "SUBMITTED" && !rejectionReason?.trim()) {
          return reply.status(400).send({
            success: false,
            message: "Rejection reason is required.",
          });
        }

        const updateData: any = { status };

        if (status === "APPROVED") {
          updateData.approvedById = userId;
          updateData.approvedAt = new Date();
          updateData.rejectionReason = null;
        } else if (status === "REJECTED") {
          updateData.rejectionReason = rejectionReason?.trim() || null;
        } else if (status === "SUBMITTED") {
          updateData.rejectionReason = null;
        } else if (status === "DRAFT") {
          updateData.rejectionReason = null;
          updateData.approvedById = null;
          updateData.approvedAt = null;
        }

        const updated = await fastify.prisma.engineeringDrawing.update({
          where: { id },
          data: updateData,
        });

        if (status === "APPROVED") {
          await syncSalesOrderWorkflow(
            salesOrderId,
            WorkflowStage.DRAWING_APPROVED,
            userId,
            `Drawing ${updated.drawingNo} approved`
          );
        } else if (status === "REJECTED") {
          await syncSalesOrderWorkflow(
            salesOrderId,
            WorkflowStage.REVISION_REQUIRED,
            userId,
            `Drawing ${updated.drawingNo} rejected: ${rejectionReason?.trim() || "revision required"}`
          );
        }

        return reply.send({
          success: true,
          message: "Drawing status updated.",
          data: updated,
        });
      } catch (error: any) {
        adminLogs.error("Failed to update drawing status", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error updating drawing status.",
          error: error.message,
        });
      }
    }
  );

  // 6. Send drawing via Email / WhatsApp
  fastify.post(
    "/drawing/send",
    {
      schema: {
        tags: ["Export Orders"],
        summary: "Send drawing via Email / WhatsApp",
      },
      preHandler: preHandlers,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const bodySchema = z.object({
          drawingId: z.string().uuid(),
          method: z.enum(["EMAIL", "WHATSAPP", "BOTH"]),
          email: z.string().email().optional().nullable(),
          phone: z.string().optional().nullable(),
          subject: z.string().optional().nullable(),
          message: z.string().optional().nullable(),
        });

        const validation = bodySchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validation.error.issues,
          });
        }

        const { drawingId, method, email, phone, subject, message } = validation.data;
        const companyId = request.admin?.companyId;
        const userId = request.admin?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized. Missing company info.",
          });
        }

        // Find drawing with project and salesOrder details
        const drawing = await fastify.prisma.engineeringDrawing.findFirst({
          where: { id: drawingId, project: { companyId } },
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
          },
        });

        if (!drawing) {
          return reply.status(404).send({
            success: false,
            message: "Drawing not found.",
          });
        }

        const salesOrderId = drawing.project?.salesOrderId;
        if (!salesOrderId || !(await canManageDrawingOrder(salesOrderId, request))) {
          return reply.status(403).send({
            success: false,
            message: "View only: you can only send drawings for sales orders assigned to you.",
          });
        }

        const salesOrder = drawing.project?.salesOrder;

        // Auto-fetch target details if not provided
        let targetEmail = email;
        let targetPhone = phone;

        if (!targetEmail || !targetPhone) {
          // Parse contact details
          if (salesOrder?.contactDetails) {
            const parts = salesOrder.contactDetails.split("|").map(p => p.trim());
            // Format is: Name | Phone | Email
            if (parts.length >= 3) {
              if (!targetEmail && parts[2]?.includes("@")) targetEmail = parts[2];
              if (!targetPhone) targetPhone = parts[1];
            } else {
              // Try to find email and phone in any part
              for (const part of parts) {
                if (!targetEmail && part.includes("@")) targetEmail = part;
                if (!targetPhone && /^[+\d\s-]{10,20}$/.test(part)) targetPhone = part;
              }
            }
          }

          // Fallback to customer contacts
          if (salesOrder?.customer?.contacts) {
            const primaryContact = salesOrder.customer.contacts.find(c => c.isPrimary) || salesOrder.customer.contacts[0];
            if (primaryContact) {
              if (!targetEmail && primaryContact.email) targetEmail = primaryContact.email;
              if (!targetPhone && primaryContact.phone) targetPhone = primaryContact.phone;
            }
          }
        }

        const defaultSubject = subject || `Engineering Drawing for Order ${salesOrder?.dveplCode || ""}: ${drawing.drawingNo}`;
        const defaultMessage = message || `Dear Customer,\n\nPlease find attached the engineering drawing: ${drawing.title} (${drawing.drawingNo}) for your order ${salesOrder?.dveplCode || ""}.\n\nBest Regards,\nDVEPL Team`;

        let emailSent = false;
        let whatsappLink = "";

        // Get API base URL dynamically
        const host = request.headers.host || "localhost:8000";
        const protocol = (request.raw as any).socket?.encrypted ? "https" : "http";
        const apiBaseUrl = `${protocol}://${host}`;

        // 1. Process Email
        if ((method === "EMAIL" || method === "BOTH") && targetEmail) {
          // Verify file exists if local
          let attachmentOptions: any[] = [];
          if (drawing.fileUrl) {
            if (/^https?:\/\//i.test(drawing.fileUrl)) {
              // Remote URL attachment
              attachmentOptions.push({
                filename: drawing.fileName,
                path: drawing.fileUrl,
              });
            } else {
              const fileName = path.basename(drawing.fileUrl);
              const filePath = path.join(uploadsDirectory, fileName);
              if (existsSync(filePath)) {
                attachmentOptions.push({
                  filename: drawing.fileName,
                  path: filePath,
                });
              }
            }
          }

          const dbConfig = await fastify.prisma.notificationConfiguration.findUnique({
            where: { companyId },
          });
          const savedSettings = (await fastify.prisma.companySettings.findUnique({ where: { companyId } }))?.data as any || {};
          const savedSmtp = savedSettings.smtpSettings || {};

          const smtpHost = dbConfig?.smtpHost || savedSmtp.host;
          const smtpPort = dbConfig?.smtpPort || savedSmtp.port;
          const smtpUsername = dbConfig?.smtpUsername || savedSmtp.username || savedSmtp.email;
          const smtpPassword = dbConfig?.smtpPassword || savedSmtp.password;
          const smtpFromEmail = dbConfig?.smtpFromEmail || savedSettings.emailSettings?.address || smtpUsername;
          const smtpFromName = dbConfig?.smtpFromName || savedSmtp.title || savedSettings.emailSettings?.name;

          if (!smtpHost || !smtpPort) {
            return reply.status(400).send({
              success: false,
              message: "SMTP host and port must be configured before sending a drawing email.",
            });
          }

          const parsedPort = parseInt(String(smtpPort), 10);
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parsedPort,
            secure: parsedPort === 465,
            auth: smtpUsername && smtpPassword
              ? { user: smtpUsername, pass: smtpPassword }
              : undefined,
            connectionTimeout: 10000,
          });

          await transporter.sendMail({
            from: `"${smtpFromName || "DVEPL"}" <${smtpFromEmail || "no-reply@dvepl.com"}>`,
            to: targetEmail,
            subject: defaultSubject,
            html: defaultMessage.replace(/\n/g, "<br>"),
            attachments: attachmentOptions,
          });

          emailSent = true;
          adminLogs.info("Drawing email sent successfully", { drawingId, to: targetEmail });
        }

        // 2. Process WhatsApp (generate link)
        if (method === "WHATSAPP" || method === "BOTH") {
          const rawPhone = targetPhone ? targetPhone.replace(/\D/g, "") : "";
          // Format text for whatsapp url
          const text = encodeURIComponent(
            `${defaultSubject}\n\n${defaultMessage}\n\nDrawing Link: ${
              /^https?:\/\//i.test(drawing.fileUrl) 
                ? drawing.fileUrl 
                : `${apiBaseUrl}${drawing.fileUrl}`
            }`
          );
          whatsappLink = `https://wa.me/${rawPhone ? rawPhone : ""}?text=${text}`;
        }

        if (emailSent || whatsappLink) {
          await syncSalesOrderWorkflow(
            salesOrderId,
            WorkflowStage.DRAWING_SENT,
            userId,
            `Drawing ${drawing.drawingNo} sent to customer via ${method}`
          );
        }

        return reply.send({
          success: true,
          message: "Action processed successfully.",
          data: {
            emailSent,
            whatsappLink,
            recipientEmail: targetEmail || null,
            recipientPhone: targetPhone || null,
          }
        });

      } catch (error: any) {
        adminLogs.error("Failed to send drawing", { error });
        return reply.status(500).send({
          success: false,
          message: "Failed to process send action.",
          error: error.message,
        });
      }
    }
  );
}

export default adminExportOrdersRouteGroup;
