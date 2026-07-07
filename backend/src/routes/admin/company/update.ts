import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";


import { adminLogs } from "../../../services/logger/contextLogger";
import { updateCompanySchema } from "../../../schemas/admin/company/company.schema";


async function adminCompanyUpdateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Company"],
        summary: "Update Company",
        description: "Update company details",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const validationResult = updateCompanySchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid company data.",
            error: validationResult.error.issues,
          });
        }

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

        const company = await fastify.prisma.company.update({
          where: {
            id,
          },
          data: validationResult.data,
        });

        adminLogs.info("Company updated", {
          companyId: company.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Company updated successfully.",
          data: company,
        });
      } catch (error: any) {
        adminLogs.error("Company update failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating company.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default adminCompanyUpdateRoutes;