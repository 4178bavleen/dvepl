import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateDepartmentSchema } from "../../../schemas/admin/department/department.schema";

interface Params {
  id: string;
}

async function updateDepartmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Department"],
        summary: "Update Department",
        description: "Update details of an existing department.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params as Params;
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const validationResult = updateDepartmentSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid department update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid department data.",
            error: validationResult.error.issues,
          });
        }

        const { branchId, name, code, isActive } = validationResult.data;

        // Verify department exists and belongs to this company
        const existingDepartment = await fastify.prisma.department.findFirst({
          where: {
            id,
            deletedAt: null,
            branch: {
              companyId,
            },
          },
        });

        if (!existingDepartment) {
          return reply.status(404).send({
            success: false,
            message: "Department not found.",
          });
        }

        // Verify branch if branchId is changing
        if (branchId && branchId !== existingDepartment.branchId) {
          const branch = await fastify.prisma.branch.findFirst({
            where: {
              id: branchId,
              companyId,
              deletedAt: null,
            },
          });

          if (!branch) {
            return reply.status(404).send({
              success: false,
              message: "Branch not found.",
            });
          }
        }

        // Verify department code uniqueness in the target branch
        if (code || branchId) {
          const targetBranchId = branchId || existingDepartment.branchId;
          const targetCode = code || existingDepartment.code;

          const duplicateDepartment = await fastify.prisma.department.findFirst({
            where: {
              branchId: targetBranchId,
              code: targetCode,
              deletedAt: null,
              NOT: {
                id,
              },
            },
          });

          if (duplicateDepartment) {
            return reply.status(409).send({
              success: false,
              message: "Department code already exists for this branch.",
            });
          }
        }

        const updatedDepartment = await fastify.prisma.department.update({
          where: {
            id,
          },
          data: {
            branchId,
            name,
            code,
            isActive,
          },
        });

        adminLogs.info("Department updated successfully", {
          departmentId: updatedDepartment.id,
          updatedBy: request.admin?.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Department updated successfully.",
          data: updatedDepartment,
        });
      } catch (error: any) {
        adminLogs.error("Department update failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating department.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updateDepartmentRoutes;
