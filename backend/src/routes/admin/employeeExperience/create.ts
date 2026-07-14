import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createEmployeeExperienceSchema } from "../../../schemas/admin/employeeExperience/employeeExperience.schema";

async function createEmployeeExperienceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Employee Experience"],
        summary: "Create Employee Experience",
        description: "Create a new work experience record for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createEmployeeExperienceSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid experience data.",
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

        const { employeeId, companyName, designation, fromDate, toDate } = validationResult.data;

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

        const experience = await fastify.prisma.employeeExperience.create({
          data: {
            employeeId,
            companyName,
            designation,
            fromDate,
            toDate,
          },
        });

        adminLogs.info("Employee experience created successfully", {
          createdBy: (request.admin as any)?.id,
          experienceId: experience.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Employee experience created successfully.",
          data: experience,
        });
      } catch (error: any) {
        adminLogs.error("Create Employee Experience Failed", { error });
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

export default createEmployeeExperienceRoutes;
