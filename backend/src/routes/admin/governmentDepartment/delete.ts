import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteGovernmentDepartmentRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Government Department"],
        summary: "Delete Government Department",
        description: "Hard deletes a government department master record.",
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

        // Validate department belongs to company
        const department = await fastify.prisma.governmentDepartment.findFirst({
          where: { id, companyId },
        });

        if (!department) {
          return reply.status(404).send({
            success: false,
            message: "Government department not found.",
          });
        }

        // Check if there are dependent tenders
        const dependentTenders = await fastify.prisma.tender.findFirst({
          where: { governmentDepartmentId: id, deletedAt: null },
        });
        if (dependentTenders) {
          return reply.status(400).send({
            success: false,
            message: "Cannot delete department as it is linked to active tenders.",
          });
        }

        await fastify.prisma.governmentDepartment.delete({
          where: { id },
        });

        adminLogs.info("Government department deleted successfully", { departmentId: id });

        return reply.status(200).send({
          success: true,
          message: "Government department deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Government department delete failed", { error });
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

export default deleteGovernmentDepartmentRoute;
