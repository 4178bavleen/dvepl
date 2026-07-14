import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateCostCenterSchema } from "../../../schemas/admin/costCenter/costCenter.schema";

interface Params {
  id: string;
}

async function updateCostCenterRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Cost Center"],
        summary: "Update Cost Center",
        description: "Update details of an existing cost center.",
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const validationResult = updateCostCenterSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid cost center update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid cost center data.",
            error: validationResult.error.issues,
          });
        }

        const { departmentId, code, name, budget } = validationResult.data;

        // Verify cost center exists and is active
        const existingCostCenter = await fastify.prisma.costCenter.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!existingCostCenter) {
          return reply.status(404).send({
            success: false,
            message: "Cost center not found.",
          });
        }

        // Verify department belongs to same company
        if (departmentId && departmentId !== existingCostCenter.departmentId) {
          const department = await fastify.prisma.department.findFirst({
            where: {
              id: departmentId,
              deletedAt: null,
              branch: {
                companyId,
              },
            },
          });

          if (!department) {
            return reply.status(404).send({
              success: false,
              message: "Department not found or does not belong to your company.",
            });
          }
        }

        // Verify code uniqueness in the company if it is changing
        if (code && code !== existingCostCenter.code) {
          const duplicateCostCenter = await fastify.prisma.costCenter.findUnique({
            where: {
              companyId_code: {
                companyId,
                code,
              },
            },
          });

          if (duplicateCostCenter) {
            return reply.status(409).send({
              success: false,
              message: "Cost center code already exists for this company.",
            });
          }
        }

        const updatedCostCenter = await fastify.prisma.costCenter.update({
          where: {
            id,
          },
          data: {
            departmentId,
            code,
            name,
            budget,
          },
        });

        adminLogs.info("Cost Center updated successfully", {
          costCenterId: updatedCostCenter.id,
          updatedBy: request.user?.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Cost center updated successfully.",
          data: updatedCostCenter,
        });
      } catch (error: any) {
        adminLogs.error("Cost center update failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating cost center.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updateCostCenterRoutes;
