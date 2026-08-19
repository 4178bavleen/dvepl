import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { z } from "zod";

import { adminLogs } from "../../../services/logger/contextLogger";
import {
  canWorkOnOrderStage,
  isAdminUser,
} from "../../../utils/orderAccess";

const addAttachmentSchema = z.object({
  fileName: z.string().min(1, "File name is required."),
  fileUrl: z.string().min(1, "File URL is required."),
  fileSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().optional(),
  category: z.string().optional(),
  uploadedById: z.string().uuid().optional(),
});

interface Params {
  id: string;
}

interface DeleteParams {
  attachmentId: string;
}

async function adminSalesOrderAttachmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // ==========================
  // Add Attachment
  // ==========================

  fastify.post(
    "/:id",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Add Sales Order Attachment",
        description:
          "Attaches a project document (BOM/BOQ, PO Copy, drawings, etc.) to a sales order.",
      },
    },
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const performerId = request.admin?.id;
        const { id } = request.params;

        if (!companyId) {
          return reply
            .status(401)
            .send({ success: false, message: "Company info missing." });
        }

        const validation = addAttachmentSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validation.error.issues,
          });
        }

        const payload = validation.data;

        const salesOrder = await fastify.prisma.salesOrder.findFirst({
          where: { id, companyId, deletedAt: null },
          select: {
            id: true,
            workflowStage: true,
            assignments: {
              select: {
                userId: true,
                stage: true,
              },
            },
          },
        });

        if (!salesOrder) {
          return reply.status(404).send({
            success: false,
            message: "Sales Order not found.",
          });
        }

        if (
          !canWorkOnOrderStage(
            salesOrder.assignments,
            salesOrder.workflowStage,
            performerId,
            isAdminUser(request.admin),
          )
        ) {
          return reply.status(403).send({
            success: false,
            message:
              "Access denied: you are not assigned to work on this order at its current stage.",
          });
        }

        const newAttachment = await fastify.prisma.salesOrderAttachment.create({
          data: {
            salesOrderId: id,
            fileName: payload.fileName,
            fileUrl: payload.fileUrl,
            fileSize: payload.fileSize ?? null,
            mimeType: payload.mimeType ?? null,
            category: payload.category ?? null,
            uploadedById: payload.uploadedById || performerId!,
          },
        });

        adminLogs.info("Sales Order attachment added", {
          salesOrderId: id,
          attachmentId: newAttachment.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Document attached successfully.",
          data: newAttachment,
        });
      } catch (error: any) {
        adminLogs.error("Failed to add Sales Order attachment", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while attaching document.",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );

  // ==========================
  // List Attachments
  // ==========================

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "List Sales Order Attachments",
        description: "Fetch all project documents attached to a sales order.",
      },
    },
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const { id } = request.params;

        if (!companyId) {
          return reply
            .status(401)
            .send({ success: false, message: "Company info missing." });
        }

        const salesOrder = await fastify.prisma.salesOrder.findFirst({
          where: { id, companyId, deletedAt: null },
          select: { id: true },
        });

        if (!salesOrder) {
          return reply.status(404).send({
            success: false,
            message: "Sales Order not found.",
          });
        }

        const attachments =
          await fastify.prisma.salesOrderAttachment.findMany({
            where: { salesOrderId: id },
            orderBy: { createdAt: "desc" },
          });

        return reply.send({
          success: true,
          message: "Attachments fetched successfully.",
          data: attachments,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch Sales Order attachments", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching attachments.",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );

  // ==========================
  // Delete Attachment
  // ==========================

  fastify.delete(
    "/:attachmentId",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Delete Sales Order Attachment",
        description: "Remove a project document from a sales order.",
      },
    },
    async (
      request: FastifyRequest<{ Params: DeleteParams }>,
      reply: FastifyReply,
    ) => {
      try {
        const companyId = request.admin?.companyId;
        const { attachmentId } = request.params;

        if (!companyId) {
          return reply
            .status(401)
            .send({ success: false, message: "Company info missing." });
        }

        const existing = await fastify.prisma.salesOrderAttachment.findFirst({
          where: {
            id: attachmentId,
            salesOrder: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            salesOrder: {
              select: {
                workflowStage: true,
                assignments: {
                  select: {
                    userId: true,
                    stage: true,
                  },
                },
              },
            },
          },
        });

        if (!existing) {
          return reply.status(404).send({
            success: false,
            message: "Attachment not found.",
          });
        }

        if (
          !canWorkOnOrderStage(
            existing.salesOrder.assignments,
            existing.salesOrder.workflowStage,
            request.admin?.id,
            isAdminUser(request.admin),
          )
        ) {
          return reply.status(403).send({
            success: false,
            message:
              "Access denied: you are not assigned to work on this order at its current stage.",
          });
        }

        await fastify.prisma.salesOrderAttachment.delete({
          where: { id: attachmentId },
        });

        adminLogs.info("Sales Order attachment deleted", {
          attachmentId,
          salesOrderId: existing.salesOrderId,
        });

        return reply.send({
          success: true,
          message: "Document removed successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Failed to delete Sales Order attachment", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while removing document.",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminSalesOrderAttachmentRoutes;
