import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateAttendanceSchema } from "../../../schemas/admin/attendance/attendance.schema";
import { AttendanceStatus } from "@prisma/client";

async function updateAttendanceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Attendance"],
        summary: "Update Attendance",
        description: "Update details of an attendance record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateAttendanceSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
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

        const { id } = request.params as { id: string };
        const data = validationResult.data;

        // Check Attendance Record Exists and belongs to company
        const existingAttendance = await fastify.prisma.attendance.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingAttendance) {
          return reply.status(404).send({
            success: false,
            message: "Attendance record not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        let targetEmployeeId = existingAttendance.employeeId;
        if (data.employeeId && data.employeeId !== existingAttendance.employeeId) {
          const newEmployee = await fastify.prisma.employee.findFirst({
            where: {
              id: data.employeeId,
              companyId,
              deletedAt: null,
            },
          });

          if (!newEmployee) {
            return reply.status(400).send({
              success: false,
              message: "Invalid employee ID.",
            });
          }
          targetEmployeeId = data.employeeId;
        }

        // Handle date normalization and duplicate check if date or employee changes
        let targetDate = existingAttendance.date;
        if (data.date) {
          const normalizedDate = new Date(data.date);
          normalizedDate.setUTCHours(0, 0, 0, 0);
          targetDate = normalizedDate;
        }

        if (
          (data.date && targetDate.getTime() !== existingAttendance.date.getTime()) ||
          (data.employeeId && targetEmployeeId !== existingAttendance.employeeId)
        ) {
          const duplicateAttendance = await fastify.prisma.attendance.findUnique({
            where: {
              employeeId_date: {
                employeeId: targetEmployeeId,
                date: targetDate,
              },
            },
          });

          if (duplicateAttendance && duplicateAttendance.id !== id) {
            return reply.status(409).send({
              success: false,
              message: "Attendance record already exists for this employee on this date.",
            });
          }
        }

        const { status, ...rest } = data;

        const updatedAttendance = await fastify.prisma.attendance.update({
          where: {
            id,
          },
          data: {
            ...rest,
            ...(status ? { status: status as AttendanceStatus } : {}),
            ...(data.date ? { date: targetDate } : {}),
          },
        });

        adminLogs.info("Attendance record updated successfully", {
          updatedBy: (request.admin as any)?.id,
          attendanceId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Attendance record updated successfully.",
          data: updatedAttendance,
        });
      } catch (error: any) {
        adminLogs.error("Update Attendance Failed", { error });
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

export default updateAttendanceRoutes;
