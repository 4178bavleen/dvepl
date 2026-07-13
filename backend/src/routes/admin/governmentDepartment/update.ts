import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateGovernmentDepartmentSchema } from "../../../schemas/admin/governmentDepartment/governmentDepartment.schema";

async function updateGovernmentDepartmentRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Government Department"],
        summary: "Update Government Department",
        description: "Updates an existing government department master record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateGovernmentDepartmentSchema.safeParse(request.body);

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

        const { id } = request.params as { id: string };
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const data = validation.data;

        // Fetch existing department
        const existingDept = await fastify.prisma.governmentDepartment.findFirst({
          where: { id, companyId },
        });

        if (!existingDept) {
          return reply.status(404).send({
            success: false,
            message: "Government department not found.",
          });
        }

        // Validate unique name if changed
        if (data.name && data.name !== existingDept.name) {
          const checkDup = await fastify.prisma.governmentDepartment.findUnique({
            where: {
              companyId_name: {
                companyId: companyId,
                name: data.name,
              },
            },
          });
          if (checkDup) {
            return reply.status(409).send({
              success: false,
              message: "A department with this name already exists in the company.",
            });
          }
        }

        const department = await fastify.prisma.governmentDepartment.update({
          where: { id },
          data,
        });

        adminLogs.info("Government department updated successfully", { departmentId: id });

        return reply.status(200).send({
          success: true,
          message: "Government department updated successfully.",
          data: department,
        });
      } catch (error: any) {
        adminLogs.error("Government department update failed", { error });
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

export default updateGovernmentDepartmentRoute;
