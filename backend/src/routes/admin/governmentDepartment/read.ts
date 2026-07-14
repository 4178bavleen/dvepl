import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readGovernmentDepartmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all government departments for company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Government Department"],
        summary: "Read Government Departments",
        description: "Returns all government departments.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const departments = await fastify.prisma.governmentDepartment.findMany({
          where: {
            companyId,
          },
          orderBy: {
            name: "asc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Government departments fetched successfully.",
          data: departments,
        });
      } catch (error: any) {
        adminLogs.error("Read government departments failed", { error });
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

  // Read by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Government Department"],
        summary: "Read Government Department By Id",
        description: "Returns detailed information of a government department.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        const department = await fastify.prisma.governmentDepartment.findFirst({
          where: {
            id,
            companyId,
          },
          include: {
            sections: true,
            tenders: {
              select: { id: true, title: true, status: true },
            },
          },
        });

        if (!department) {
          return reply.status(404).send({
            success: false,
            message: "Government department not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Government department fetched successfully.",
          data: department,
        });
      } catch (error: any) {
        adminLogs.error("Read government department by id failed", { error });
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

export default readGovernmentDepartmentRoutes;
