import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeShiftSchema } from "../../../schemas/admin/employeeShift/employeeShift.schema";

async function updateEmployeeShiftRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee Shift Assignment"],
        summary: "Update Employee Shift Assignment",
        description: "Update details of an employee shift assignment.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeShiftSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
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

        const { id } = request.params as { id: string };
        const data = validationResult.data;

        // Check Assignment Exists and belongs to company
        const existingAssignment = await fastify.prisma.employeeShift.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingAssignment) {
          return reply.status(404).send({
            success: false,
            message: "Shift assignment not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        if (data.employeeId && data.employeeId !== existingAssignment.employeeId) {
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

        // If shiftId is changing, verify that new shift exists
        if (data.shiftId && data.shiftId !== existingAssignment.shiftId) {
          const newShift = await fastify.prisma.shift.findFirst({
            where: {
              id: data.shiftId,
              deletedAt: null,
            },
          });

          if (!newShift) {
            return reply.status(400).send({
              success: false,
              message: "Invalid shift definition ID.",
            });
          }
        }

        const updatedAssignment = await fastify.prisma.employeeShift.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee shift assignment updated successfully", {
          updatedBy: (request.user as any)?.id,
          assignmentId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee shift assignment updated successfully.",
          data: updatedAssignment,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Shift Assignment Failed", { error });
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

export default updateEmployeeShiftRoutes;
