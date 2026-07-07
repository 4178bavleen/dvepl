import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function adminCompanyDeleteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Company"],
        summary: "Delete Company",
        description: "Soft delete company",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const existingCompany = await fastify.prisma.company.findUnique({
          where: {
            id,
          },
        });

        if (!existingCompany || existingCompany.deletedAt) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        await fastify.prisma.company.delete({
          where: {
            id,
          },
         
        });

        adminLogs.info("Company deleted", {
          companyId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Company deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Company deletion failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting company.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default adminCompanyDeleteRoutes;