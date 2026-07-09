import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readSalaryRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read salary records (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Salary"],
        summary: "Read Salary Records",
        description: "Returns employee salary history. If employeeId query param is provided, returns salary records for that employee.",
        querystring: {
          type: "object",
          properties: {
            employeeId: { type: "string" },
          },
        },
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

        const { employeeId } = request.query as { employeeId?: string };

        const salaries = await fastify.prisma.salary.findMany({
          where: {
            employee: {
              companyId,
              deletedAt: null,
            },
            ...(employeeId ? { employeeId } : {}),
          },
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
          orderBy: {
            effectiveFrom: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Salary records fetched successfully.",
          data: salaries,
        });
      } catch (error: any) {
        adminLogs.error("Read Salaries Failed", { error });
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

  // Read salary record by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Salary"],
        summary: "Read Salary By Id",
        description: "Returns details of an employee salary record.",
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

        const salary = await fastify.prisma.salary.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!salary) {
          return reply.status(404).send({
            success: false,
            message: "Salary record not found.",
          });
        }

        return reply.send({
          success: true,
          data: salary,
        });
      } catch (error: any) {
        adminLogs.error("Read Salary By Id Failed", { error });
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

export default readSalaryRoutes;
