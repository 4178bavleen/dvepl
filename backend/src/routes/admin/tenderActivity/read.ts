import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { tenderActivityListQuerySchema } from "../../../schemas/admin/tenderActivity/tenderActivity.schema";

async function readTenderActivityRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all activities for a tender
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tender Activity"],
        summary: "List Tender Activities",
        description: "Returns activity logs for a specific tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
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

        const validation = tenderActivityListQuerySchema.safeParse(request.query);
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

        const { tenderId } = validation.data;

        // Verify Tender belongs to company
        const tender = await fastify.prisma.tender.findFirst({
          where: { id: tenderId, companyId, deletedAt: null },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        const activities = await fastify.prisma.tenderActivity.findMany({
          where: { tenderId },
          orderBy: { createdAt: "desc" },
        });

        return reply.status(200).send({
          success: true,
          message: "Tender activities fetched successfully.",
          data: activities,
        });
      } catch (error: any) {
        adminLogs.error("List Tender Activities failed", { error });
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

  // Read tender activity by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tender Activity"],
        summary: "Read Tender Activity Details",
        description: "Returns detailed information of a tender activity log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
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

        const activity = await fastify.prisma.tenderActivity.findFirst({
          where: {
            id,
            tender: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            tender: {
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
            message: "Tender activity not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Tender activity details fetched successfully.",
          data: activity,
        });
      } catch (error: any) {
        adminLogs.error("Read tender activity details failed", { error });
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

export default readTenderActivityRoutes;
