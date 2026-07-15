import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteCounterRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Reference Code Counter"],
        summary: "Delete Reference Code Counter",
        description: "Hard deletes a sequence counter.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.delete"]),
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

        const counter = await fastify.prisma.referenceCodeCounter.findFirst({
          where: { id, companyId },
        });

        if (!counter) {
          return reply.status(404).send({
            success: false,
            message: "Reference code counter not found.",
          });
        }

        await fastify.prisma.referenceCodeCounter.delete({
          where: { id },
        });

        adminLogs.info("Reference code counter deleted successfully", {
          counterId: id,
          companyId,
        });

        return reply.status(200).send({
          success: true,
          message: "Reference code counter deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete reference code counter failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );
}

export default deleteCounterRoute;
