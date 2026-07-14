import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateSectionSchema } from "../../../schemas/admin/section/section.schema";

async function updateSectionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Section"],
        summary: "Update Section",
        description: "Updates details of an existing section.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateSectionSchema.safeParse(request.body);

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
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const data = validation.data;

        // Fetch section and verify tenant
        const existingSection = await fastify.prisma.section.findFirst({
          where: {
            id,
            department: {
              branch: {
                companyId,
              },
            },
            deletedAt: null,
          },
        });

        if (!existingSection) {
          return reply.status(404).send({
            success: false,
            message: "Section not found.",
          });
        }

        // Validate new department if changing
        let targetDeptId = existingSection.departmentId;
        if (data.departmentId && data.departmentId !== existingSection.departmentId) {
          const department = await fastify.prisma.department.findFirst({
            where: { id: data.departmentId, deletedAt: null },
            include: {
              branch: { select: { companyId: true } },
            },
          });
          if (!department || department.branch.companyId !== companyId) {
            return reply.status(403).send({
              success: false,
              message: "Access Denied: Department belongs to another tenant.",
            });
          }
          targetDeptId = data.departmentId;
        }

        // Validate unique name inside the target department
        if (data.name || data.departmentId) {
          const checkDup = await fastify.prisma.section.findUnique({
            where: {
              departmentId_name: {
                departmentId: targetDeptId,
                name: data.name ?? existingSection.name,
              },
            },
          });
          if (checkDup && checkDup.id !== id) {
            return reply.status(409).send({
              success: false,
              message: "A section with this name already exists in the department.",
            });
          }
        }

        const section = await fastify.prisma.section.update({
          where: { id },
          data,
        });

        adminLogs.info("Section updated successfully", { sectionId: id });

        return reply.status(200).send({
          success: true,
          message: "Section updated successfully.",
          data: section,
        });
      } catch (error: any) {
        adminLogs.error("Section update failed", { error });
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

export default updateSectionRoute;
