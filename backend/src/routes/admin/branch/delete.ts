import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

interface Params {
  id: string;
}

async function deleteBranchRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Branch"],
        summary: "Delete Branch",
        description: "Soft delete a branch",
      },
    },

    async (
      request: FastifyRequest<{
        Params: Params;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const branch = await fastify.prisma.branch.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          include: {
            departments: {
              where: {
                deletedAt: null,
              },
            },
            employees: {
              where: {
                deletedAt: null,
              },
            },
          },
        });

        if (!branch) {
          return reply.status(404).send({
            success: false,
            message: "Branch not found.",
          });
        }

        if (branch.departments.length > 0) {
          return reply.status(409).send({
            success: false,
            message:
              "Cannot delete branch. Departments are associated with this branch.",
          });
        }

        if (branch.employees.length > 0) {
          return reply.status(409).send({
            success: false,
            message:
              "Cannot delete branch. Employees are associated with this branch.",
          });
        }

        await fastify.prisma.branch.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        });

        adminLogs.info("Branch deleted successfully", {
          branchId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Branch deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Branch deletion failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting branch.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default deleteBranchRoutes;