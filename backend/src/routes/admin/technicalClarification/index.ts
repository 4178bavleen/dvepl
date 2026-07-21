import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { z } from "zod";

const createClarificationSchema = z.object({
  tenderId: z.string(),
  question: z.string(),
  raisedById: z.string(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

const updateClarificationSchema = z.object({
  question: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "ANSWERED", "REVISED", "CLOSED"]).optional(),
});

const createReplySchema = z.object({
  reply: z.string(),
  repliedById: z.string().optional(),
  isInternal: z.boolean().default(false),
});

const addAttachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  uploadedById: z.string().optional(),
});

async function adminTechnicalClarificationRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // 1. List all clarifications
  fastify.get(
    "/read",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Read Technical Clarifications",
        description: "Returns all clarifications for the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company information missing." });
        }

        const clarifications = await fastify.prisma.technicalClarification.findMany({
          where: { companyId, deletedAt: null },
          include: {
            tender: { select: { id: true, title: true } },
            raisedBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.status(200).send({
          success: true,
          message: "Clarifications fetched successfully.",
          data: clarifications,
        });
      } catch (error: any) {
        adminLogs.error("Read Clarifications failed", { error });
        return reply.status(500).send({ success: false, message: "Server Error.", details: error.message });
      }
    }
  );

  // 2. Read single clarification details
  fastify.get(
    "/read/:id",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Read Technical Clarification Details",
        description: "Returns detailed thread information for a technical clarification.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company info missing." });
        }

        const clarification = await fastify.prisma.technicalClarification.findFirst({
          where: { id, companyId, deletedAt: null },
          include: {
            tender: { select: { id: true, title: true } },
            raisedBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            replies: {
              include: { repliedBy: { select: { id: true, name: true, email: true } } },
              orderBy: { createdAt: "asc" },
            },
            attachments: {
              include: { uploadedBy: { select: { id: true, name: true, email: true } } },
              orderBy: { createdAt: "asc" },
            },
            activities: {
              include: { performedBy: { select: { id: true, name: true, email: true } } },
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!clarification) {
          return reply.status(404).send({ success: false, message: "Clarification thread not found." });
        }

        return reply.status(200).send({
          success: true,
          message: "Clarification thread fetched successfully.",
          data: clarification,
        });
      } catch (error: any) {
        adminLogs.error("Read Clarification Detail failed", { error });
        return reply.status(500).send({ success: false, message: "Server Error.", details: error.message });
      }
    }
  );

  // 3. Create clarification
  fastify.post(
    "/create",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Create Technical Clarification",
        description: "Creates a new technical clarification thread.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const performerId = request.admin?.id;

        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company info missing." });
        }

        const validation = createClarificationSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({ success: false, message: "Invalid request data.", error: validation.error.issues });
        }

        const payload = validation.data;

        const newClarification = await fastify.prisma.$transaction(async (tx) => {
          const clarification = await tx.technicalClarification.create({
            data: {
              companyId,
              tenderId: payload.tenderId,
              question: payload.question,
              raisedById: payload.raisedById,
              assignedToId: payload.assignedToId,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
              priority: payload.priority,
              status: "OPEN",
            },
          });

          await tx.technicalClarificationActivity.create({
            data: {
              clarificationId: clarification.id,
              action: "CREATED",
              newValue: JSON.parse(JSON.stringify(clarification)),
              performedById: performerId || payload.raisedById,
            },
          });

          return clarification;
        });

        return reply.status(201).send({
          success: true,
          message: "Technical clarification thread created.",
          data: newClarification,
        });
      } catch (error: any) {
        adminLogs.error("Create Clarification failed", { error });
        return reply.status(500).send({ success: false, message: "Server Error.", details: error.message });
      }
    }
  );

  // 4. Update clarification
  fastify.put(
    "/update/:id",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Update Technical Clarification",
        description: "Updates properties of a technical clarification.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const performerId = request.admin?.id;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company info missing." });
        }

        const validation = updateClarificationSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({ success: false, message: "Invalid request data.", error: validation.error.issues });
        }

        const payload = validation.data;

        const updatedClarification = await fastify.prisma.$transaction(async (tx) => {
          const old = await tx.technicalClarification.findFirst({
            where: { id, companyId, deletedAt: null },
          });

          if (!old) {
            throw new Error("Clarification thread not found.");
          }

          const clarification = await tx.technicalClarification.update({
            where: { id },
            data: {
              question: payload.question,
              assignedToId: payload.assignedToId,
              dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
              priority: payload.priority,
              status: payload.status,
            },
          });

          // Log activities if changed
          if (payload.status && payload.status !== old.status) {
            await tx.technicalClarificationActivity.create({
              data: {
                clarificationId: clarification.id,
                action: "STATUS_CHANGED",
                oldValue: { status: old.status },
                newValue: { status: clarification.status },
                performedById: performerId,
              },
            });
          }

          if (payload.assignedToId && payload.assignedToId !== old.assignedToId) {
            await tx.technicalClarificationActivity.create({
              data: {
                clarificationId: clarification.id,
                action: "ASSIGNED",
                oldValue: { assignedToId: old.assignedToId },
                newValue: { assignedToId: clarification.assignedToId },
                performedById: performerId,
              },
            });
          }

          return clarification;
        });

        return reply.status(200).send({
          success: true,
          message: "Clarification updated successfully.",
          data: updatedClarification,
        });
      } catch (error: any) {
        adminLogs.error("Update Clarification failed", { error });
        return reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // 5. Delete clarification
  fastify.delete(
    "/delete/:id",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Delete Technical Clarification",
        description: "Soft deletes a technical clarification thread.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.delete"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company info missing." });
        }

        await fastify.prisma.technicalClarification.updateMany({
          where: { id, companyId },
          data: { deletedAt: new Date() },
        });

        return reply.status(200).send({
          success: true,
          message: "Clarification deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Clarification failed", { error });
        return reply.status(500).send({ success: false, message: "Server Error.", details: error.message });
      }
    }
  );

  // 6. Post Reply
  fastify.post(
    "/reply/:id",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Add Reply",
        description: "Adds a reply to the technical clarification thread.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const performerId = request.admin?.id;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company info missing." });
        }

        const validation = createReplySchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({ success: false, message: "Invalid request data.", error: validation.error.issues });
        }

        const payload = validation.data;

        const newReply = await fastify.prisma.$transaction(async (tx) => {
          const clarification = await tx.technicalClarification.findFirst({
            where: { id, companyId, deletedAt: null },
          });

          if (!clarification) {
            throw new Error("Clarification thread not found.");
          }

          const replyRecord = await tx.technicalClarificationReply.create({
            data: {
              clarificationId: id,
              reply: payload.reply,
              repliedById: payload.repliedById || performerId!,
              isInternal: payload.isInternal,
            },
          });

          // Auto update status to ANSWERED if public reply
          if (!payload.isInternal && clarification.status === "OPEN") {
            await tx.technicalClarification.update({
              where: { id },
              data: { status: "ANSWERED" },
            });

            await tx.technicalClarificationActivity.create({
              data: {
                clarificationId: id,
                action: "STATUS_CHANGED",
                oldValue: { status: "OPEN" },
                newValue: { status: "ANSWERED" },
                performedById: performerId,
              },
            });
          }

          await tx.technicalClarificationActivity.create({
            data: {
              clarificationId: id,
              action: "REPLIED",
              newValue: { replyId: replyRecord.id, isInternal: payload.isInternal },
              performedById: performerId,
            },
          });

          return replyRecord;
        });

        return reply.status(201).send({
          success: true,
          message: "Reply added successfully.",
          data: newReply,
        });
      } catch (error: any) {
        adminLogs.error("Post Reply failed", { error });
        return reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // 7. Add Attachment
  fastify.post(
    "/attachment/:id",
    {
      schema: {
        tags: ["Technical Clarification"],
        summary: "Add Attachment",
        description: "Attaches a file to the technical clarification thread.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const performerId = request.admin?.id;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({ success: false, message: "Company info missing." });
        }

        const validation = addAttachmentSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({ success: false, message: "Invalid request data.", error: validation.error.issues });
        }

        const payload = validation.data;

        const newAttachment = await fastify.prisma.$transaction(async (tx) => {
          const clarification = await tx.technicalClarification.findFirst({
            where: { id, companyId, deletedAt: null },
          });

          if (!clarification) {
            throw new Error("Clarification thread not found.");
          }

          const attachment = await tx.technicalClarificationAttachment.create({
            data: {
              clarificationId: id,
              fileName: payload.fileName,
              fileUrl: payload.fileUrl,
              fileSize: payload.fileSize,
              mimeType: payload.mimeType,
              uploadedById: payload.uploadedById || performerId!,
            },
          });

          await tx.technicalClarificationActivity.create({
            data: {
              clarificationId: id,
              action: "ATTACHMENT_ADDED",
              newValue: { attachmentId: attachment.id, fileName: payload.fileName },
              performedById: performerId,
            },
          });

          return attachment;
        });

        return reply.status(201).send({
          success: true,
          message: "Attachment added successfully.",
          data: newAttachment,
        });
      } catch (error: any) {
        adminLogs.error("Add Attachment failed", { error });
        return reply.status(500).send({ success: false, message: error.message });
      }
    }
  );
}

export default adminTechnicalClarificationRouteGroup;
