import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeEmergencyContactSchema } from "../../../schemas/admin/employee-emergency-contact/employee-emergency-contact.schema";

async function updateEmployeeEmergencyContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee Emergency Contact"],
        summary: "Update Employee Emergency Contact",
        description: "Update details of an employee emergency contact.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeEmergencyContactSchema.safeParse(request.body);

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

        // Check Contact Exists and belongs to company
        const existingContact = await fastify.prisma.employeeEmergencyContact.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingContact) {
          return reply.status(404).send({
            success: false,
            message: "Employee emergency contact not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        if (data.employeeId && data.employeeId !== existingContact.employeeId) {
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

        const updatedContact = await fastify.prisma.employeeEmergencyContact.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee emergency contact updated successfully", {
          updatedBy: (request.user as any)?.id,
          contactId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee emergency contact updated successfully.",
          data: updatedContact,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Emergency Contact Failed", { error });
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

export default updateEmployeeEmergencyContactRoutes;
