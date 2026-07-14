import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteTenderRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Tender"],
        summary: "Soft Delete Tender",
        description: "Soft deletes a tender.",
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

        const tender = await fastify.prisma.tender.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        await fastify.prisma.tender.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Tender soft deleted successfully", { tenderId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Tender soft delete failed", { error });
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

export default deleteTenderRoute;
