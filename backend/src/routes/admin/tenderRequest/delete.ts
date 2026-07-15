import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteTenderRequestRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Tender Request"],
        summary: "Soft Delete Tender Request",
        description: "Soft deletes a tender request.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.delete"]),
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

        // Check Tender Request & Tenant
        const tenderRequest = await fastify.prisma.tenderRequest.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!tenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request not found.",
          });
        }

        // Soft Delete
        await fastify.prisma.tenderRequest.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Tender request soft deleted successfully", { tenderRequestId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender request deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Tender request soft delete failed", { error });
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

export default deleteTenderRequestRoute;
