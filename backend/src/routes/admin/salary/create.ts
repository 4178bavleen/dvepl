import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createSalarySchema } from "../../../schemas/admin/salary/salary.schema";

async function createSalaryRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Salary"],
        summary: "Create Salary Record",
        description: "Create a new salary details record for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createSalarySchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid salary data.",
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

        const { employeeId, effectiveFrom, basic, hra, allowances, deductions, ctc } = validationResult.data;

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

        const salary = await fastify.prisma.salary.create({
          data: {
            employeeId,
            effectiveFrom,
            basic,
            hra,
            allowances,
            deductions,
            ctc,
          },
        });

        adminLogs.info("Salary record created successfully", {
          createdBy: (request.admin as any)?.id,
          salaryId: salary.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Salary record created successfully.",
          data: salary,
        });
      } catch (error: any) {
        adminLogs.error("Create Salary Failed", { error });
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

export default createSalaryRoutes;
