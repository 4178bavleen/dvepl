import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createLeaveSchema } from "../../../schemas/admin/leave/leave.schema";
import { LeaveStatus } from "@prisma/client";

async function createLeaveRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Leave"],
        summary: "Create Leave Request",
        description: "Create a new leave request for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createLeaveSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid leave data.",
            error: validationResult.error.issues,
          });
        }

        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { employeeId, leaveType, fromDate, toDate, reason, status, approvedById } = validationResult.data;

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

        const leave = await fastify.prisma.leave.create({
          data: {
            employeeId,
            leaveType,
            fromDate,
            toDate,
            reason,
            status: status as LeaveStatus,
            approvedById,
          },
        });

        adminLogs.info("Leave request created successfully", {
          createdBy: (request.user as any)?.id,
          leaveId: leave.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Leave request created successfully.",
          data: leave,
        });
      } catch (error: any) {
        adminLogs.error("Create Leave Failed", { error });
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

export default createLeaveRoutes;
