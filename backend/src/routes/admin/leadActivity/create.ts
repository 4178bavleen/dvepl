import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createLeadActivitySchema } from "../../../schemas/admin/leadActivity/leadActivity.schema";

async function createLeadActivityRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Lead Activity"],
        summary: "Log Lead Activity",
        description: "Logs a note, call log, or follow-up activity for a lead.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------
        const validation = createLeadActivitySchema.safeParse(request.body);

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

        //--------------------------------
        // Check Lead & Tenant
        //--------------------------------
        const lead = await fastify.prisma.tenderRequest.findFirst({
          where: { id: data.leadId, companyId, deletedAt: null },
        });

        if (!lead) {
          return reply.status(404).send({
            success: false,
            message: "Lead not found.",
          });
        }

        //--------------------------------
        // Create LeadActivity inside AuditLog
        //--------------------------------
        const activity = await fastify.prisma.auditLog.create({
          data: {
            userId: userId || null,
            module: "TenderRequest",
            recordId: data.leadId,
            action: data.activityType,
            newValue: { remarks: data.remarks },
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
          },
        });

        const formattedActivity = {
          id: activity.id,
          leadId: activity.recordId,
          activityType: activity.action,
          remarks: (activity.newValue as any)?.remarks || "",
          performedBy: activity.userId || "System",
          createdAt: activity.createdAt,
        };

        adminLogs.info("Lead activity logged successfully", {
          activityId: formattedActivity.id,
          leadId: formattedActivity.leadId,
        });

        return reply.status(201).send({
          success: true,
          message: "Lead activity logged successfully.",
          data: formattedActivity,
        });
      } catch (error: any) {
        adminLogs.error("Lead activity logging failed", { error });
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

export default createLeadActivityRoute;
