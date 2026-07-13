import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateSubDivisionSchema } from "../../../schemas/admin/subDivision/subDivision.schema";

async function updateSubDivisionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Sub-Division"],
        summary: "Update Sub-Division",
        description: "Updates details of an existing sub-division.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateSubDivisionSchema.safeParse(request.body);

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

        // Fetch sub-division and verify tenant
        const existingSubDiv = await fastify.prisma.subDivision.findFirst({
          where: {
            id,
            division: {
              section: {
                department: {
                  branch: {
                    companyId,
                  },
                },
              },
            },
            deletedAt: null,
          },
        });

        if (!existingSubDiv) {
          return reply.status(404).send({
            success: false,
            message: "Sub-Division not found.",
          });
        }

        // Validate new division if changing
        let targetDivId = existingSubDiv.divisionId;
        if (data.divisionId && data.divisionId !== existingSubDiv.divisionId) {
          const division = await fastify.prisma.division.findFirst({
            where: { id: data.divisionId, deletedAt: null },
            include: {
              section: {
                include: {
                  department: {
                    include: {
                      branch: { select: { companyId: true } },
                    },
                  },
                },
              },
            },
          });
          if (!division || division.section.department.branch.companyId !== companyId) {
            return reply.status(403).send({
              success: false,
              message: "Access Denied: Division belongs to another tenant.",
            });
          }
          targetDivId = data.divisionId;
        }

        // Validate unique name inside the target division
        if (data.name || data.divisionId) {
          const checkDup = await fastify.prisma.subDivision.findUnique({
            where: {
              divisionId_name: {
                divisionId: targetDivId,
                name: data.name ?? existingSubDiv.name,
              },
            },
          });
          if (checkDup && checkDup.id !== id) {
            return reply.status(409).send({
              success: false,
              message: "A sub-division with this name already exists in the division.",
            });
          }
        }

        const subDivision = await fastify.prisma.subDivision.update({
          where: { id },
          data,
        });

        adminLogs.info("Sub-Division updated successfully", { subDivisionId: id });

        return reply.status(200).send({
          success: true,
          message: "Sub-Division updated successfully.",
          data: subDivision,
        });
      } catch (error: any) {
        adminLogs.error("Sub-Division update failed", { error });
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

export default updateSubDivisionRoute;
