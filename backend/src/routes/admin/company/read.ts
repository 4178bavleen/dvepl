import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function adminCompanyReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Company"],
        summary: "Get All Companies",
        description: "Fetch all active companies",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companies = await fastify.prisma.company.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        adminLogs.info("Companies fetched successfully", {
          totalCompanies: companies.length,
        });

        return reply.status(200).send({
          success: true,
          message: "Companies fetched successfully.",
          count: companies.length,
          data: companies,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch companies", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching companies.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default adminCompanyReadRoutes;