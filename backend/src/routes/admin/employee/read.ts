import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all employees
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee"],
        summary: "Read Employees",
        description: "Returns all employees of the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const employees = await fastify.prisma.employee.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Employees fetched successfully.",
          data: employees,
        });
      } catch (error: any) {
        adminLogs.error("Read Employees failed", { error });
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

  // Read employee by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee"],
        summary: "Read Employee By Id",
        description: "Returns employee details.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        const employee = await fastify.prisma.employee.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!employee) {
          return reply.status(404).send({
            success: false,
            message: "Employee not found.",
          });
        }

        return reply.send({
          success: true,
          data: employee,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee By Id Failed", { error });
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

export default readEmployeeRoutes;
