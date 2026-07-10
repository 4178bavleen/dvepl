import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeSchema } from "../../../schemas/admin/employee/employee.schema";

async function updateEmployeeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee"],
        summary: "Update Employee",
        description: "Update details of an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeSchema.safeParse(request.body);

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

        // Check Employee Exists
        const existingEmployee = await fastify.prisma.employee.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!existingEmployee) {
          return reply.status(404).send({
            success: false,
            message: "Employee not found.",
          });
        }

        // Validate Branch if provided
        if (data.branchId) {
          const branch = await fastify.prisma.branch.findFirst({
            where: {
              id: data.branchId,
              companyId,
              deletedAt: null,
            },
          });
          if (!branch) {
            return reply.status(400).send({
              success: false,
              message: "Invalid branch.",
            });
          }
        }

        // Validate Department if provided
        if (data.departmentId) {
          const department = await fastify.prisma.department.findFirst({
            where: {
              id: data.departmentId,
              branch: {
                companyId,
              },
              deletedAt: null,
            },
          });
          if (!department) {
            return reply.status(400).send({
              success: false,
              message: "Invalid department.",
            });
          }
        }

        // Validate Team if provided
        if (data.teamId) {
          const team = await fastify.prisma.team.findFirst({
            where: {
              id: data.teamId,
              department: {
                branch: {
                  companyId,
                },
              },
              deletedAt: null,
            },
          });
          if (!team) {
            return reply.status(400).send({
              success: false,
              message: "Invalid team.",
            });
          }
        }

        // Validate Designation if provided
        if (data.designationId) {
          const designation = await fastify.prisma.designation.findFirst({
            where: {
              id: data.designationId,
              deletedAt: null,
            },
          });
          if (!designation) {
            return reply.status(400).send({
              success: false,
              message: "Invalid designation.",
            });
          }
        }

        // Validate Reporting Manager if provided
        if (data.reportsToId) {
          const manager = await fastify.prisma.employee.findFirst({
            where: {
              id: data.reportsToId,
              companyId,
              deletedAt: null,
            },
          });
          if (!manager) {
            return reply.status(400).send({
              success: false,
              message: "Invalid reporting manager.",
            });
          }
        }

        // Check employeeCode uniqueness if it is changing
        if (data.employeeCode && data.employeeCode !== existingEmployee.employeeCode) {
          const duplicateCode = await fastify.prisma.employee.findUnique({
            where: {
              employeeCode: data.employeeCode,
            },
          });

          if (duplicateCode && duplicateCode.id !== id) {
            return reply.status(409).send({
              success: false,
              message: "Employee code already exists.",
            });
          }
        }

        const updatedEmployee = await fastify.prisma.employee.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee updated successfully", {
          updatedBy: (request.user as any)?.id,
          employeeId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee updated successfully.",
          data: updatedEmployee,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Failed", { error });
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

export default updateEmployeeRoutes;
