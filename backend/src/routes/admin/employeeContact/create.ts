import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createEmployeeContactSchema } from "../../../schemas/admin/employee-contact/employee-contact.schema";

async function createEmployeeContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Employee Contact"],
        summary: "Create Employee Contact",
        description: "Create a new contact details for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createEmployeeContactSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid contact data.",
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

        const { employeeId, type, value, isPrimary } = validationResult.data;

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

        // If this contact is marked as primary, demote other primary contacts of the same type for this employee
        if (isPrimary) {
          await fastify.prisma.employeeContact.updateMany({
            where: {
              employeeId,
              type,
              isPrimary: true,
            },
            data: {
              isPrimary: false,
            },
          });
        }

        const contact = await fastify.prisma.employeeContact.create({
          data: {
            employeeId,
            type,
            value,
            isPrimary,
          },
        });

        adminLogs.info("Employee contact created successfully", {
          createdBy: (request.user as any)?.id,
          contactId: contact.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Employee contact created successfully.",
          data: contact,
        });
      } catch (error: any) {
        adminLogs.error("Create Employee Contact Failed", { error });
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

export default createEmployeeContactRoutes;
