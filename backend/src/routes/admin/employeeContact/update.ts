import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeContactSchema } from "../../../schemas/admin/employeeContact/employeeContact.schema";

async function updateEmployeeContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee Contact"],
        summary: "Update Employee Contact",
        description: "Update details of an employee contact.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeContactSchema.safeParse(request.body);

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

        // Check Contact Exists and belongs to company
        const existingContact = await fastify.prisma.employeeContact.findFirst({
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
            message: "Employee contact not found.",
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

        const targetEmployeeId = data.employeeId || existingContact.employeeId;
        const targetType = data.type || existingContact.type;

        // If isPrimary is set to true, demote other primary contacts of the same type for this employee
        if (data.isPrimary) {
          await fastify.prisma.employeeContact.updateMany({
            where: {
              employeeId: targetEmployeeId,
              type: targetType,
              isPrimary: true,
              NOT: {
                id,
              },
            },
            data: {
              isPrimary: false,
            },
          });
        }

        const updatedContact = await fastify.prisma.employeeContact.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee contact updated successfully", {
          updatedBy: (request.admin as any)?.id,
          contactId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee contact updated successfully.",
          data: updatedContact,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Contact Failed", { error });
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

export default updateEmployeeContactRoutes;
