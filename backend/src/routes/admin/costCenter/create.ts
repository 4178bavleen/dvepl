import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createCostCenterSchema } from "../../../schemas/admin/costCenter/costCenter.schema";

async function createCostCenterRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Cost Center"],
        summary: "Create Cost Center",
        description: "Create a new cost center for the company",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const validationResult = createCostCenterSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid cost center data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid cost center data.",
            error: validationResult.error.issues,
          });
        }

        const { departmentId, code, name, budget } = validationResult.data;

        // Verify department belongs to the same company
        if (departmentId) {
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

        // Verify cost center code uniqueness within the company
        const existingCostCenter = await fastify.prisma.costCenter.findUnique({
          where: {
            companyId_code: {
              companyId,
              code,
            },
          },
        });

        if (existingCostCenter) {
          if (existingCostCenter.deletedAt) {
            return reply.status(409).send({
              success: false,
              message: "A cost center with this code already exists (inactive/deleted). Please contact support to restore it or use a different code.",
            });
          }

          return reply.status(409).send({
            success: false,
            message: "Cost center code already exists for this company.",
          });
        }

        const costCenter = await fastify.prisma.costCenter.create({
          data: {
            companyId,
            departmentId,
            code,
            name,
            budget,
          },
        });

        adminLogs.info("Cost Center created successfully", {
          costCenterId: costCenter.id,
          companyId,
        });

        return reply.status(201).send({
          success: true,
          message: "Cost center created successfully.",
          data: costCenter,
        });
      } catch (error: any) {
        adminLogs.error("Cost center creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating cost center.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createCostCenterRoutes;
