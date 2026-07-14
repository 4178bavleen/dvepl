import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteLeadRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Lead"],
        summary: "Soft Delete Lead",
        description: "Soft deletes a sales opportunity lead.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.delete"]),
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

        //--------------------------------
        // Check Lead & Tenant
        //--------------------------------
        const lead = await fastify.prisma.tenderRequest.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!lead) {
          return reply.status(404).send({
            success: false,
            message: "Lead not found.",
          });
        }

        //--------------------------------
        // Soft Delete
        //--------------------------------
        await fastify.prisma.tenderRequest.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Lead soft deleted successfully", { leadId: id });

        return reply.status(200).send({
          success: true,
          message: "Lead deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Lead soft delete failed", { error });
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

export default deleteLeadRoute;
