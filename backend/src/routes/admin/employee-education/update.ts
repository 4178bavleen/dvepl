import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeEducationSchema } from "../../../schemas/admin/employee-education/employee-education.schema";

async function updateEmployeeEducationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee Education"],
        summary: "Update Employee Education",
        description: "Update details of an employee education record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeEducationSchema.safeParse(request.body);

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

        // Check Education Record Exists and belongs to company
        const existingEducation = await fastify.prisma.employeeEducation.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingEducation) {
          return reply.status(404).send({
            success: false,
            message: "Education record not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        if (data.employeeId && data.employeeId !== existingEducation.employeeId) {
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

        const updatedEducation = await fastify.prisma.employeeEducation.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee education updated successfully", {
          updatedBy: (request.user as any)?.id,
          educationId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee education updated successfully.",
          data: updatedEducation,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Education Failed", { error });
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

export default updateEmployeeEducationRoutes;
