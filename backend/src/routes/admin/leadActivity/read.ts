import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { leadActivityListQuerySchema } from "../../../schemas/admin/leadActivity/leadActivity.schema";

async function readLeadActivityRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all activities for a lead
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Lead Activity"],
        summary: "List Lead Activities",
        description: "Returns activity logs for a specific lead.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Query Validation
        //--------------------------------
        const validation = leadActivityListQuerySchema.safeParse(request.query);
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

        const { leadId } = validation.data;

        //--------------------------------
        // Tenant Verification
        //--------------------------------
        const lead = await fastify.prisma.lead.findFirst({
          where: { id: leadId, companyId, deletedAt: null },
        });

        if (!lead) {
          return reply.status(404).send({
            success: false,
            message: "Lead not found.",
          });
        }

        const activities = await fastify.prisma.leadActivity.findMany({
          where: { leadId },
          orderBy: { createdAt: "desc" },
        });

        return reply.status(200).send({
          success: true,
          message: "Lead activities fetched successfully.",
          data: activities,
        });
      } catch (error: any) {
        adminLogs.error("List Lead Activities failed", { error });
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

  // Read lead activity by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Lead Activity"],
        summary: "Read Lead Activity Details",
        description: "Returns detailed information of a lead activity log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user?.companyId;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Fetch Activity with tenant check
        //--------------------------------
        const activity = await fastify.prisma.leadActivity.findFirst({
          where: {
            id,
            lead: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            lead: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        if (!activity) {
          return reply.status(404).send({
            success: false,
            message: "Lead activity not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Lead activity details fetched successfully.",
          data: activity,
        });
      } catch (error: any) {
        adminLogs.error("Read lead activity details failed", { error });
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

export default readLeadActivityRoutes;
