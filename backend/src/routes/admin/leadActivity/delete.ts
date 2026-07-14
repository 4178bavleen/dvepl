import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteLeadActivityRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Lead Activity"],
        summary: "Delete Lead Activity",
        description: "Deletes a lead activity log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Check Activity & Tenant
        //--------------------------------
        const activity = await fastify.prisma.leadActivity.findFirst({
          where: {
            id,
            lead: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!activity) {
          return reply.status(404).send({
            success: false,
            message: "Lead activity not found.",
          });
        }

        //--------------------------------
        // Hard Delete (LeadActivity has no deletedAt field in schema)
        //--------------------------------
        await fastify.prisma.leadActivity.delete({
          where: { id },
        });

        adminLogs.info("Lead activity deleted successfully", { activityId: id });

        return reply.status(200).send({
          success: true,
          message: "Lead activity deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Lead activity delete failed", { error });
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

export default deleteLeadActivityRoute;
