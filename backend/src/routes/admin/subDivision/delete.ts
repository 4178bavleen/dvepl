import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteSubDivisionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Sub-Division"],
        summary: "Soft Delete Sub-Division",
        description: "Soft deletes an organizational sub-division.",
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

        // Validate sub-division belongs to company
        const subDivision = await fastify.prisma.subDivision.findFirst({
          where: {
            id,
            division: {
              section: {
                department: {
                  branch: {
                    companyId,
                  },
                },
              },
            },
            deletedAt: null,
          },
        });

        if (!subDivision) {
          return reply.status(404).send({
            success: false,
            message: "Sub-Division not found.",
          });
        }

        // Check if there are dependent tenders
        const dependentTenders = await fastify.prisma.tender.findFirst({
          where: { subDivisionId: id, deletedAt: null },
        });
        if (dependentTenders) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete sub-division as it is linked to active tenders.",
          });
        }

        await fastify.prisma.subDivision.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Sub-Division soft deleted successfully", { subDivisionId: id });

        return reply.status(200).send({
          success: true,
          message: "Sub-Division deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Sub-Division soft delete failed", { error });
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

export default deleteSubDivisionRoute;
