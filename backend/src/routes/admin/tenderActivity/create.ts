import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createTenderActivitySchema } from "../../../schemas/admin/tenderActivity/tenderActivity.schema";

async function createTenderActivityRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tender Activity"],
        summary: "Log Tender Activity",
        description: "Logs an activity or notes for a tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createTenderActivitySchema.safeParse(request.body);

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

        // Verify Tender belongs to company
        const tender = await fastify.prisma.tender.findFirst({
          where: { id: data.tenderId, companyId, deletedAt: null },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        const activity = await fastify.prisma.tenderActivity.create({
          data: {
            ...data,
            performedBy: userId || data.performedBy || "System",
          },
        });

        adminLogs.info("Tender activity logged successfully", {
          activityId: activity.id,
          tenderId: activity.tenderId,
        });

        return reply.status(201).send({
          success: true,
          message: "Tender activity logged successfully.",
          data: activity,
        });
      } catch (error: any) {
        adminLogs.error("Tender activity logging failed", { error });
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

export default createTenderActivityRoute;
