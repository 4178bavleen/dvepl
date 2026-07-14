import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createEmployeeEducationSchema } from "../../../schemas/admin/employeeEducation/employeeEducation.schema";

async function createEmployeeEducationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Employee Education"],
        summary: "Create Employee Education",
        description: "Create a new education history record for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createEmployeeEducationSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid education data.",
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

        const { employeeId, degree, institution, yearOfPassing, grade } = validationResult.data;

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

        const education = await fastify.prisma.employeeEducation.create({
          data: {
            employeeId,
            degree,
            institution,
            yearOfPassing,
            grade,
          },
        });

        adminLogs.info("Employee education created successfully", {
          createdBy: (request.admin as any)?.id,
          educationId: education.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Employee education created successfully.",
          data: education,
        });
      } catch (error: any) {
        adminLogs.error("Create Employee Education Failed", { error });
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

export default createEmployeeEducationRoutes;
