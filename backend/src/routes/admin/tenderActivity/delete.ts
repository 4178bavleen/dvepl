import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteTenderActivityRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Tender Activity"],
        summary: "Delete Tender Activity",
        description: "Hard deletes a tender activity log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.delete"]),
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

        // Validate activity belongs to company
        const activity = await fastify.prisma.tenderActivity.findFirst({
          where: {
            id,
            tender: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!activity) {
          return reply.status(404).send({
            success: false,
            message: "Tender activity not found.",
          });
        }

        await fastify.prisma.tenderActivity.delete({
          where: { id },
        });

        adminLogs.info("Tender activity deleted successfully", { activityId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender activity deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Tender activity delete failed", { error });
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

export default deleteTenderActivityRoute;
