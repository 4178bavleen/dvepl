import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteCommunicationRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Communication History"],
        summary: "Delete Communication Log",
        description: "Deletes a customer communication log entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.update"]),
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
        // Check Log & Tenant
        //--------------------------------
        const log = await fastify.prisma.communicationHistory.findFirst({
          where: {
            id,
            customer: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!log) {
          return reply.status(404).send({
            success: false,
            message: "Communication log not found.",
          });
        }

        //--------------------------------
        // Hard Delete (CommunicationHistory has no deletedAt field in schema)
        //--------------------------------
        await fastify.prisma.communicationHistory.delete({
          where: { id },
        });

        adminLogs.info("Communication log deleted successfully", { logId: id });

        return reply.status(200).send({
          success: true,
          message: "Communication log deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Communication log delete failed", { error });
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

export default deleteCommunicationRoute;
