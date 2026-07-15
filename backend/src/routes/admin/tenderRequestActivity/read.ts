import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { tenderRequestActivityListQuerySchema } from "../../../schemas/admin/tenderRequestActivity/tenderRequestActivity.schema";

async function readTenderRequestActivityRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all activities for a tender request
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tender Request Activity"],
        summary: "List Tender Request Activities",
        description: "Returns activity logs for a specific tender request.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const validation = tenderRequestActivityListQuerySchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid query parameters.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const { tenderRequestId } = validation.data;

        // Tenant Verification
        const tenderRequest = await fastify.prisma.tenderRequest.findFirst({
          where: { id: tenderRequestId, companyId, deletedAt: null },
        });

        if (!tenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request not found.",
          });
        }

        const activities = await fastify.prisma.auditLog.findMany({
          where: {
            module: "TenderRequest",
            recordId: tenderRequestId,
          },
          orderBy: { createdAt: "desc" },
        });

        const formattedActivities = activities.map((activity) => ({
          id: activity.id,
          tenderRequestId: activity.recordId,
          activityType: activity.action,
          remarks: (activity.newValue as any)?.remarks || "",
          performedBy: activity.userId || "System",
          createdAt: activity.createdAt,
        }));

        return reply.status(200).send({
          success: true,
          message: "Tender request activities fetched successfully.",
          data: formattedActivities,
        });
      } catch (error: any) {
        adminLogs.error("List Tender Request Activities failed", { error });
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

  // Read tender request activity by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tender Request Activity"],
        summary: "Read Tender Request Activity Details",
        description: "Returns detailed information of a tender request activity log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Fetch Activity with tenant check
        const activity = await fastify.prisma.auditLog.findFirst({
          where: {
            id,
            module: "TenderRequest",
          },
        });

        if (!activity) {
          return reply.status(404).send({
            success: false,
            message: "Tender request activity not found.",
          });
        }

        const tenderRequest = await fastify.prisma.tenderRequest.findFirst({
          where: {
            id: activity.recordId,
            companyId,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
          },
        });

        if (!tenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request activity not found.",
          });
        }

        const formattedActivity = {
          id: activity.id,
          tenderRequestId: activity.recordId,
          activityType: activity.action,
          remarks: (activity.newValue as any)?.remarks || "",
          performedBy: activity.userId || "System",
          createdAt: activity.createdAt,
          tenderRequest,
        };

        return reply.status(200).send({
          success: true,
          message: "Tender request activity details fetched successfully.",
          data: formattedActivity,
        });
      } catch (error: any) {
        adminLogs.error("Read tender request activity details failed", { error });
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

export default readTenderRequestActivityRoutes;
