import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createAttendanceSchema } from "../../../schemas/admin/attendance/attendance.schema";
import { AttendanceStatus } from "@prisma/client";

async function createAttendanceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Attendance"],
        summary: "Create Attendance Record",
        description: "Create a new attendance record for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createAttendanceSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid attendance data.",
            error: validationResult.error.issues,
          });
        }

        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { employeeId, date, status, checkIn, checkOut, remarks } = validationResult.data;

        // Verify employee exists and belongs to company
        const employee = await fastify.prisma.employee.findFirst({
          where: {
            id: employeeId,
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

        // Normalize date to start of day UTC
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        // Check if attendance already exists for this employee on this date
        const existingAttendance = await fastify.prisma.attendance.findUnique({
          where: {
            employeeId_date: {
              employeeId,
              date: normalizedDate,
            },
          },
        });

        if (existingAttendance) {
          return reply.status(409).send({
            success: false,
            message: "Attendance record already exists for this employee on this date.",
          });
        }

        const attendance = await fastify.prisma.attendance.create({
          data: {
            employeeId,
            date: normalizedDate,
            status: status as AttendanceStatus,
            checkIn,
            checkOut,
            remarks,
          },
        });

        adminLogs.info("Attendance record created successfully", {
          createdBy: (request.admin as any)?.id,
          attendanceId: attendance.id,
          employeeId,
          date: normalizedDate,
        });

        return reply.status(201).send({
          success: true,
          message: "Attendance record created successfully.",
          data: attendance,
        });
      } catch (error: any) {
        adminLogs.error("Create Attendance Failed", { error });
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

export default createAttendanceRoutes;
