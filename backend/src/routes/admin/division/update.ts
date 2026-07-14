import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateDivisionSchema } from "../../../schemas/admin/division/division.schema";

async function updateDivisionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Division"],
        summary: "Update Division",
        description: "Updates details of an existing division.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateDivisionSchema.safeParse(request.body);

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

        // Fetch division and verify tenant
        const existingDivision = await fastify.prisma.division.findFirst({
          where: {
            id,
            section: {
              department: {
                branch: {
                  companyId,
                },
              },
            },
            deletedAt: null,
          },
        });

        if (!existingDivision) {
          return reply.status(404).send({
            success: false,
            message: "Division not found.",
          });
        }

        // Validate new section if changing
        let targetSectionId = existingDivision.sectionId;
        if (data.sectionId && data.sectionId !== existingDivision.sectionId) {
          const section = await fastify.prisma.section.findFirst({
            where: { id: data.sectionId, deletedAt: null },
            include: {
              department: {
                include: {
                  branch: { select: { companyId: true } },
                },
              },
            },
          });
          if (!section || section.department.branch.companyId !== companyId) {
            return reply.status(403).send({
              success: false,
              message: "Access Denied: Section belongs to another tenant.",
            });
          }
          targetSectionId = data.sectionId;
        }

        // Validate unique name inside the target section
        if (data.name || data.sectionId) {
          const checkDup = await fastify.prisma.division.findUnique({
            where: {
              sectionId_name: {
                sectionId: targetSectionId,
                name: data.name ?? existingDivision.name,
              },
            },
          });
          if (checkDup && checkDup.id !== id) {
            return reply.status(409).send({
              success: false,
              message: "A division with this name already exists in the section.",
            });
          }
        }

        const division = await fastify.prisma.division.update({
          where: { id },
          data,
        });

        adminLogs.info("Division updated successfully", { divisionId: id });

        return reply.status(200).send({
          success: true,
          message: "Division updated successfully.",
          data: division,
        });
      } catch (error: any) {
        adminLogs.error("Division update failed", { error });
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

export default updateDivisionRoute;
