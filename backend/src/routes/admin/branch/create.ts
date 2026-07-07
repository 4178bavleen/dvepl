import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";


import { adminLogs } from "../../../services/logger/contextLogger";

import { createBranchSchema } from "../../../schemas/admin/branch/branch.schema";

async function createBranchRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Branch"],
        summary: "Create Branch",
        description: "Create a new branch",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createBranchSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid branch data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid branch data.",
            error: validationResult.error.issues,
          });
        }

        const {
          companyId,
          name,
          code,
          address,
          city,
          state,
          pincode,
          isActive,
        } = validationResult.data;

        // Check Company
        const company = await fastify.prisma.company.findUnique({
          where: {
            id: companyId,
          },
        });

        if (!company || company.deletedAt) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        // Check duplicate branch code within company
        const existingBranch = await fastify.prisma.branch.findUnique({
          where: {
            companyId_code: {
              companyId,
              code,
            },
          },
        });

        if (existingBranch) {
          return reply.status(409).send({
            success: false,
            message: "Branch code already exists for this company.",
          });
        }

        const branch = await fastify.prisma.branch.create({
          data: {
            companyId,
            name,
            code,
            address,
            city,
            state,
            pincode,
            isActive,
          },
        });

        adminLogs.info("Branch created", {
          branchId: branch.id,
          companyId,
        });

        return reply.status(201).send({
          success: true,
          message: "Branch created successfully.",
          data: branch,
        });
      } catch (error: any) {
        adminLogs.error("Branch creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating branch.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createBranchRoutes;