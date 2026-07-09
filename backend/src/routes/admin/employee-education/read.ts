import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeEducationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read education history (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee Education"],
        summary: "Read Employee Education Records",
        description: "Returns employee education records. If employeeId query param is provided, returns education records for that employee.",
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

        const education = await fastify.prisma.employeeEducation.findMany({
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
        });

        return reply.status(200).send({
          success: true,
          message: "Employee education records fetched successfully.",
          data: education,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Education Failed", { error });
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

  // Read education record by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee Education"],
        summary: "Read Employee Education By Id",
        description: "Returns details of an employee education record.",
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

        const education = await fastify.prisma.employeeEducation.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!education) {
          return reply.status(404).send({
            success: false,
            message: "Education record not found.",
          });
        }

        return reply.send({
          success: true,
          data: education,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Education By Id Failed", { error });
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

export default readEmployeeEducationRoutes;
