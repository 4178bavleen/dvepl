import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteDivisionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Division"],
        summary: "Soft Delete Division",
        description: "Soft deletes an organizational division.",
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

        // Validate division belongs to company
        const division = await fastify.prisma.division.findFirst({
          where: {
            id,
            section: {
              department: {
                branch: {
                  companyId,
                },
              },
            },
            deletedAt: null,
          },
        });

        if (!division) {
          return reply.status(404).send({
            success: false,
            message: "Division not found.",
          });
        }

        // Check if there are dependent sub-divisions
        const dependentSubDivs = await fastify.prisma.subDivision.findFirst({
          where: { divisionId: id, deletedAt: null },
        });
        if (dependentSubDivs) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete division as it contains active sub-divisions.",
          });
        }

        // Check if there are dependent tenders
        const dependentTenders = await fastify.prisma.tender.findFirst({
          where: { divisionId: id, deletedAt: null },
        });
        if (dependentTenders) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete division as it is linked to active tenders.",
          });
        }

        await fastify.prisma.division.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Division soft deleted successfully", { divisionId: id });

        return reply.status(200).send({
          success: true,
          message: "Division deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Division soft delete failed", { error });
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

export default deleteDivisionRoute;
