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

async function getDesignationByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Designation"],
        summary: "Get Designation By ID",
        description: "Fetch designation details by ID",
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const designation = await fastify.prisma.designation.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          include: {
            employees: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                employees: true,
              },
            },
          },
        });

        if (!designation) {
          return reply.status(404).send({
            success: false,
            message: "Designation not found.",
          });
        }

        adminLogs.info("Designation fetched successfully", {
          designationId: designation.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Designation fetched successfully.",
          data: designation,
        });
      } catch (error: any) {
        adminLogs.error("Failed to fetch designation", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching designation.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default getDesignationByIdRoutes;
