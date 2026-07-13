import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createGovernmentDepartmentSchema } from "../../../schemas/admin/governmentDepartment/governmentDepartment.schema";

async function createGovernmentDepartmentRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Government Department"],
        summary: "Create Government Department",
        description: "Creates a new government department master record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createGovernmentDepartmentSchema.safeParse(request.body);

        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const data = validation.data;
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Validate Company
        const company = await fastify.prisma.company.findFirst({
          where: { id: data.companyId, deletedAt: null },
        });
        if (!company) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        // Validate unique name for this company
        const existingDept = await fastify.prisma.governmentDepartment.findUnique({
          where: {
            companyId_name: {
              companyId: data.companyId,
              name: data.name,
            },
          },
        });

        if (existingDept) {
          return reply.status(409).send({
            success: false,
            message: "A department with this name already exists in the company.",
          });
        }

        const department = await fastify.prisma.governmentDepartment.create({
          data,
        });

        adminLogs.info("Government department created successfully", {
          departmentId: department.id,
          name: department.name,
        });

        return reply.status(201).send({
          success: true,
          message: "Government department created successfully.",
          data: department,
        });
      } catch (error: any) {
        adminLogs.error("Government department creation failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createGovernmentDepartmentRoute;
