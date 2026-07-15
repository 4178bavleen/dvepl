import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createTenderRequestActivitySchema } from "../../../schemas/admin/tenderRequestActivity/tenderRequestActivity.schema";

async function createTenderRequestActivityRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tender Request Activity"],
        summary: "Log Tender Request Activity",
        description: "Logs a note, call log, or follow-up activity for a tender request.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createTenderRequestActivitySchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const data = validation.data;
        const companyId = request.admin?.companyId;
        const userId = request.admin?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Check Tender Request & Tenant
        const tenderRequest = await fastify.prisma.tenderRequest.findFirst({
          where: { id: data.tenderRequestId, companyId, deletedAt: null },
        });

        if (!tenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request not found.",
          });
        }

        // Create Activity inside AuditLog
        const activity = await fastify.prisma.auditLog.create({
          data: {
            userId: userId || null,
            module: "TenderRequest",
            recordId: data.tenderRequestId,
            action: data.activityType,
            newValue: { remarks: data.remarks },
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        const formattedActivity = {
          id: activity.id,
          tenderRequestId: activity.recordId,
          activityType: activity.action,
          remarks: (activity.newValue as any)?.remarks || "",
          performedBy: activity.userId || "System",
          createdAt: activity.createdAt,
        };

        adminLogs.info("Tender request activity logged successfully", {
          activityId: formattedActivity.id,
          tenderRequestId: formattedActivity.tenderRequestId,
        });

        return reply.status(201).send({
          success: true,
          message: "Tender request activity logged successfully.",
          data: formattedActivity,
        });
      } catch (error: any) {
        adminLogs.error("Tender request activity logging failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createTenderRequestActivityRoute;
