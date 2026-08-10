import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { DrawingStatus, DrawingType } from "@prisma/client";
import { z } from "zod";
import { existsSync } from "fs";
import path from "path";

interface Query {
  search?: string;
  status?: string;
  assignedEngineer?: string;
  startDate?: string;
  endDate?: string;
}

const uploadsDirectory = path.join(__dirname, "../../../../uploads");

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

        const availableDrawings = drawings.filter((drawing) =>
          hasStoredDrawingFile(drawing.fileUrl),
        );

        const missingFileCount = drawings.length - availableDrawings.length;
        if (missingFileCount > 0) {
          adminLogs.warn("Excluded drawings whose uploaded files are missing", {
            missingFileCount,
          });
        }

        return reply.send({ success: true, data: availableDrawings });
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
            status: DrawingStatus.PENDING,
          },
        });

        adminLogs.info("Created drawing for sales order export context", { drawingId: drawing.id });

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

  // 5. Update drawing status (APPROVED / REJECTED / PENDING)
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
        const { status } = request.body as { status: string };

        const validStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "REJECTED"];
        if (!status || !validStatuses.includes(status.toUpperCase())) {
          return reply.status(400).send({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          });
        }

        const drawing = await fastify.prisma.engineeringDrawing.update({
          where: { id },
          data: { status: status.toUpperCase() as any },
        });

        return reply.send({
          success: true,
          message: "Drawing status updated.",
          data: drawing,
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
}

export default adminExportOrdersRouteGroup;
