import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createEmployeeEmergencyContactSchema } from "../../../schemas/admin/employeeEmergencyContact/employeeEmergencyContact.schema";

async function createEmployeeEmergencyContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Employee Emergency Contact"],
        summary: "Create Employee Emergency Contact",
        description: "Create a new emergency contact details for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createEmployeeEmergencyContactSchema.safeParse(request.body);

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

        const { employeeId, name, relationship, phone } = validationResult.data;

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

        const contact = await fastify.prisma.employeeEmergencyContact.create({
          data: {
            employeeId,
            name,
            relationship,
            phone,
          },
        });

        adminLogs.info("Employee emergency contact created successfully", {
          createdBy: (request.user as any)?.id,
          contactId: contact.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Employee emergency contact created successfully.",
          data: contact,
        });
      } catch (error: any) {
        adminLogs.error("Create Employee Emergency Contact Failed", { error });
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

export default createEmployeeEmergencyContactRoutes;
