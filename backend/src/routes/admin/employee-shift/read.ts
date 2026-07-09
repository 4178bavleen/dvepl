import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeShiftRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read assignments (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee Shift Assignment"],
        summary: "Read Employee Shift Assignments",
        description: "Returns employee shift assignments. If employeeId query param is provided, returns shift assignments for that employee.",
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

        const assignments = await fastify.prisma.employeeShift.findMany({
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
            shift: true,
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Employee shift assignments fetched successfully.",
          data: assignments,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Shift Assignments Failed", { error });
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

  // Read assignment by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee Shift Assignment"],
        summary: "Read Employee Shift Assignment By Id",
        description: "Returns details of an employee shift assignment.",
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

        const assignment = await fastify.prisma.employeeShift.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            shift: true,
          },
        });

        if (!assignment) {
          return reply.status(404).send({
            success: false,
            message: "Shift assignment not found.",
          });
        }

        return reply.send({
          success: true,
          data: assignment,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Shift Assignment By Id Failed", { error });
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

export default readEmployeeShiftRoutes;
