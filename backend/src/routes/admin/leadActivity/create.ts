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
        const companyId = request.user?.companyId;
        const userId = request.user?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Check Lead & Tenant
        //--------------------------------
        const lead = await fastify.prisma.lead.findFirst({
          where: { id: data.leadId, companyId, deletedAt: null },
        });

        if (!lead) {
          return reply.status(404).send({
            success: false,
            message: "Lead not found.",
          });
        }

        //--------------------------------
        // Create LeadActivity
        //--------------------------------
        const activity = await fastify.prisma.leadActivity.create({
          data: {
            ...data,
            performedBy: userId || "System",
          },
        });

        adminLogs.info("Lead activity logged successfully", {
          activityId: activity.id,
          leadId: activity.leadId,
        });

        return reply.status(201).send({
          success: true,
          message: "Lead activity logged successfully.",
          data: activity,
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
