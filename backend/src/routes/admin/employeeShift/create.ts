import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createEmployeeShiftSchema } from "../../../schemas/admin/employeeShift/employeeShift.schema";

async function createEmployeeShiftRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Employee Shift Assignment"],
        summary: "Assign Employee Shift",
        description: "Assign a shift to an employee with effective dates.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createEmployeeShiftSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid assignment data.",
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

        const { employeeId, shiftId, effectiveFrom, effectiveTo } = validationResult.data;

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

        // Verify shift exists and is active
        const shift = await fastify.prisma.shift.findFirst({
          where: {
            id: shiftId,
            deletedAt: null,
          },
        });

        if (!shift) {
          return reply.status(404).send({
            success: false,
            message: "Shift definition not found.",
          });
        }

        const assignment = await fastify.prisma.employeeShift.create({
          data: {
            employeeId,
            shiftId,
            effectiveFrom,
            effectiveTo,
          },
        });

        adminLogs.info("Employee shift assigned successfully", {
          createdBy: (request.admin as any)?.id,
          assignmentId: assignment.id,
          employeeId,
          shiftId,
        });

        return reply.status(201).send({
          success: true,
          message: "Employee shift assigned successfully.",
          data: assignment,
        });
      } catch (error: any) {
        adminLogs.error("Assign Employee Shift Failed", { error });
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

export default createEmployeeShiftRoutes;
