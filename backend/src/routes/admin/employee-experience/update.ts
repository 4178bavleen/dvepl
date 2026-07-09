import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeExperienceSchema } from "../../../schemas/admin/employee-experience/employee-experience.schema";

async function updateEmployeeExperienceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee Experience"],
        summary: "Update Employee Experience",
        description: "Update details of an employee experience record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeExperienceSchema.safeParse(request.body);

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

        // Check Experience Record Exists and belongs to company
        const existingExperience = await fastify.prisma.employeeExperience.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingExperience) {
          return reply.status(404).send({
            success: false,
            message: "Experience record not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        if (data.employeeId && data.employeeId !== existingExperience.employeeId) {
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

        const updatedExperience = await fastify.prisma.employeeExperience.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee experience updated successfully", {
          updatedBy: (request.user as any)?.id,
          experienceId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee experience updated successfully.",
          data: updatedExperience,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Experience Failed", { error });
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

export default updateEmployeeExperienceRoutes;
