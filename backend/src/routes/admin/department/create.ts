import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createDepartmentSchema } from "../../../schemas/admin/department/department.schema";

async function createDepartmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Department"],
        summary: "Create Department",
        description: "Create a new department",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult =
          createDepartmentSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid department data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid department data.",
            error: validationResult.error.issues,
          });
        }

        const {
          branchId,
          name,
          code,
          isActive,
        } = validationResult.data;

        const branch = await fastify.prisma.branch.findFirst({
          where: {
            id: branchId,
            deletedAt: null,
          },
        });

        if (!branch) {
          return reply.status(404).send({
            success: false,
            message: "Branch not found.",
          });
        }

        const existingDepartment =
          await fastify.prisma.department.findFirst({
            where: {
              branchId,
              code,
              deletedAt: null,
            },
          });

        if (existingDepartment) {
          return reply.status(409).send({
            success: false,
            message:
              "Department code already exists for this branch.",
          });
        }

        const department =
          await fastify.prisma.department.create({
            data: {
              branchId,
              name,
              code,
              isActive,
            },
          });

        adminLogs.info("Department created", {
          departmentId: department.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Department created successfully.",
          data: department,
        });
      } catch (error: any) {
        adminLogs.error("Department creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message:
            "Server error while creating department.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createDepartmentRoutes;