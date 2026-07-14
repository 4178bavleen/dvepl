import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readCompanyByIdRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Company"],
        summary: "Read Company By Id",
        description: "Fetch company details by id.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["company.view"]),
      ],
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params as { id: string };

        const company = await fastify.prisma.company.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Company fetched successfully.",
          data: company,
        });
      } catch (error: any) {
        adminLogs.error("Read Company By Id Failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readCompanyByIdRoute;