import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateLeaveSchema } from "../../../schemas/admin/leave/leave.schema";
import { LeaveStatus } from "@prisma/client";

async function updateLeaveRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Leave"],
        summary: "Update Leave Request",
        description: "Update details or status of a leave request record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateLeaveSchema.safeParse(request.body);

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

        // Check Leave Record Exists and belongs to company
        const existingLeave = await fastify.prisma.leave.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingLeave) {
          return reply.status(404).send({
            success: false,
            message: "Leave request not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        if (data.employeeId && data.employeeId !== existingLeave.employeeId) {
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
        }

        const { status, ...rest } = data;

        const updatedLeave = await fastify.prisma.leave.update({
          where: {
            id,
          },
          data: {
            ...rest,
            ...(status ? { status: status as LeaveStatus } : {}),
          },
        });

        adminLogs.info("Leave request updated successfully", {
          updatedBy: (request.admin as any)?.id,
          leaveId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Leave request updated successfully.",
          data: updatedLeave,
        });
      } catch (error: any) {
        adminLogs.error("Update Leave Failed", { error });
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

export default updateLeaveRoutes;
