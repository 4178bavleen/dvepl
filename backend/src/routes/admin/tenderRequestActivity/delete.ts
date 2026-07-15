import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteTenderRequestActivityRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Tender Request Activity"],
        summary: "Delete Tender Request Activity",
        description: "Deletes a tender request activity log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Check Activity & Tenant
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
        });

        if (!tenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request activity not found.",
          });
        }

        // Hard Delete
        await fastify.prisma.auditLog.delete({
          where: { id },
        });

        adminLogs.info("Tender request activity deleted successfully", { activityId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender request activity deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Tender request activity delete failed", { error });
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

export default deleteTenderRequestActivityRoute;
