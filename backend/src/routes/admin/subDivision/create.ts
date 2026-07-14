import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createSubDivisionSchema } from "../../../schemas/admin/subDivision/subDivision.schema";

async function createSubDivisionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Sub-Division"],
        summary: "Create Sub-Division",
        description: "Creates a new organizational sub-division.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createSubDivisionSchema.safeParse(request.body);

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
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Validate token company matches requested companyId
        if (data.companyId !== companyId) {
          return reply.status(403).send({
            success: false,
            message: "Access Denied: Company ID mismatch.",
          });
        }

        // Validate Division and trace back to Company to verify tenant
        const division = await fastify.prisma.division.findFirst({
          where: { id: data.divisionId, deletedAt: null },
          include: {
            section: {
              include: {
                department: {
                  include: {
                    branch: {
                      select: { companyId: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!division) {
          return reply.status(404).send({
            success: false,
            message: "Division not found.",
          });
        }

        if (division.section.department.branch.companyId !== companyId) {
          return reply.status(403).send({
            success: false,
            message: "Access Denied: Division belongs to another tenant.",
          });
        }

        // Validate unique name within this division
        const existingSubDiv = await fastify.prisma.subDivision.findUnique({
          where: {
            divisionId_name: {
              divisionId: data.divisionId,
              name: data.name,
            },
          },
        });

        if (existingSubDiv) {
          return reply.status(409).send({
            success: false,
            message: "A sub-division with this name already exists in the division.",
          });
        }

        const subDivision = await fastify.prisma.subDivision.create({
          data,
        });

        adminLogs.info("Sub-Division created successfully", {
          subDivisionId: subDivision.id,
          name: subDivision.name,
        });

        return reply.status(201).send({
          success: true,
          message: "Sub-Division created successfully.",
          data: subDivision,
        });
      } catch (error: any) {
        adminLogs.error("Sub-Division creation failed", { error });
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

export default createSubDivisionRoute;
