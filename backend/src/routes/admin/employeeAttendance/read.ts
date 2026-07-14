import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readAttendanceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all valid attendance status enum values
  fastify.get(
    "/statuses",
    {
      schema: {
        tags: ["Attendance"],
        summary: "Get Valid Attendance Statuses",
        description: "Returns the list of valid attendance status enum values.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        data: ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"],
      });
    }
  );

  // Read attendance records (optionally filtered by employeeId, startDate, endDate)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Attendance"],
        summary: "Read Attendance Records",
        description: "Returns attendance records. Can filter by employeeId, startDate, and endDate.",
        querystring: {
          type: "object",
          properties: {
            employeeId: { type: "string" },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
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

        const { employeeId, startDate, endDate } = request.query as {
          employeeId?: string;
          startDate?: string;
          endDate?: string;
        };

        const dateFilter: any = {};
        if (startDate) {
          dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
          dateFilter.lte = new Date(endDate);
        }

        const attendance = await fastify.prisma.attendance.findMany({
          where: {
            employee: {
              companyId,
              deletedAt: null,
            },
            ...(employeeId ? { employeeId } : {}),
            ...(startDate || endDate ? { date: dateFilter } : {}),
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
            date: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Attendance records fetched successfully.",
          data: attendance,
        });
      } catch (error: any) {
        adminLogs.error("Read Attendance Failed", { error });
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

  // Read attendance record by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Attendance"],
        summary: "Read Attendance By Id",
        description: "Returns details of an attendance record.",
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

        const attendance = await fastify.prisma.attendance.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!attendance) {
          return reply.status(404).send({
            success: false,
            message: "Attendance record not found.",
          });
        }

        return reply.send({
          success: true,
          data: attendance,
        });
      } catch (error: any) {
        adminLogs.error("Read Attendance By Id Failed", { error });
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

export default readAttendanceRoutes;
