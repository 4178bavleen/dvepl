import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { z } from "zod";

const createReplySchema = z.object({
  clarificationId: z.string(),
  reply: z.string(),
  repliedById: z.string().optional(),
  isInternal: z.boolean().default(false),
});

async function adminTechnicalClarificationReplyRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // 1. Create Reply
  fastify.post(
    "/create",
    {
      schema: {
        tags: ["Technical Clarification Reply"],
        summary: "Create Reply",
        description: "Creates a new reply in a technical clarification thread.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const performerId = request.admin?.id;
        const validation = createReplySchema.safeParse(request.body);
        if (!validation.success) {
          return reply.status(400).send({ success: false, message: "Invalid request data.", error: validation.error.issues });
        }

        const payload = validation.data;

        const newReply = await fastify.prisma.$transaction(async (tx) => {
          const clarification = await tx.technicalClarification.findFirst({
            where: { id: payload.clarificationId },
          });

          if (!clarification) {
            throw new Error("Clarification thread not found.");
          }

          const replyRecord = await tx.technicalClarificationReply.create({
            data: {
              clarificationId: payload.clarificationId,
              reply: payload.reply,
              repliedById: payload.repliedById || performerId!,
              isInternal: payload.isInternal,
            },
          });

          // Update status to ANSWERED if public reply on OPEN status
          if (!payload.isInternal && clarification.status === "OPEN") {
            await tx.technicalClarification.update({
              where: { id: payload.clarificationId },
              data: { status: "ANSWERED" },
            });

            await tx.technicalClarificationActivity.create({
              data: {
                clarificationId: payload.clarificationId,
                action: "STATUS_CHANGED",
                oldValue: { status: "OPEN" },
                newValue: { status: "ANSWERED" },
                performedById: performerId,
              },
            });
          }

          await tx.technicalClarificationActivity.create({
            data: {
              clarificationId: payload.clarificationId,
              action: "REPLIED",
              newValue: { replyId: replyRecord.id, isInternal: payload.isInternal },
              performedById: performerId,
            },
          });

          return replyRecord;
        });

        return reply.status(201).send({
          success: true,
          message: "Reply created successfully.",
          data: newReply,
        });
      } catch (error: any) {
        adminLogs.error("Create Reply failed", { error });
        return reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // 2. Read Replies
  fastify.get(
    "/read",
    {
      schema: {
        tags: ["Technical Clarification Reply"],
        summary: "Read Replies",
        description: "Returns replies, optionally filtered by clarificationId.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { clarificationId } = request.query as { clarificationId?: string };

        const replies = await fastify.prisma.technicalClarificationReply.findMany({
          where: clarificationId ? { clarificationId } : {},
          include: {
            repliedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        });

        return reply.status(200).send({
          success: true,
          message: "Replies fetched successfully.",
          data: replies,
        });
      } catch (error: any) {
        adminLogs.error("Read Replies failed", { error });
        return reply.status(500).send({ success: false, message: error.message });
      }
    }
  );

  // 3. Delete Reply
  fastify.delete(
    "/delete/:id",
    {
      schema: {
        tags: ["Technical Clarification Reply"],
        summary: "Delete Reply",
        description: "Deletes a clarification reply by ID.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.delete"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        await fastify.prisma.technicalClarificationReply.delete({
          where: { id },
        });

        return reply.status(200).send({
          success: true,
          message: "Reply deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Reply failed", { error });
        return reply.status(500).send({ success: false, message: error.message });
      }
    }
  );
}

export default adminTechnicalClarificationReplyRouteGroup;
