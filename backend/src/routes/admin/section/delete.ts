import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteSectionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Section"],
        summary: "Soft Delete Section",
        description: "Soft deletes an organizational section.",
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

        // Validate section belongs to company
        const section = await fastify.prisma.section.findFirst({
          where: {
            id,
            department: {
              branch: {
                companyId,
              },
            },
            deletedAt: null,
          },
        });

        if (!section) {
          return reply.status(404).send({
            success: false,
            message: "Section not found.",
          });
        }

        // Check if there are dependent divisions
        const dependentDivisions = await fastify.prisma.division.findFirst({
          where: { sectionId: id, deletedAt: null },
        });
        if (dependentDivisions) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete section as it contains active divisions.",
          });
        }

        // Check if there are dependent tenders
        const dependentTenders = await fastify.prisma.tender.findFirst({
          where: { sectionId: id, deletedAt: null },
        });
        if (dependentTenders) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete section as it is linked to active tenders.",
          });
        }

        await fastify.prisma.section.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Section soft deleted successfully", { sectionId: id });

        return reply.status(200).send({
          success: true,
          message: "Section deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Section soft delete failed", { error });
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

export default deleteSectionRoute;
