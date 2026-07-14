import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createDivisionSchema } from "../../../schemas/admin/division/division.schema";

async function createDivisionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Division"],
        summary: "Create Division",
        description: "Creates a new organizational division.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createDivisionSchema.safeParse(request.body);

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

        // Validate token company matches requested companyId
        if (data.companyId !== companyId) {
          return reply.status(403).send({
            success: false,
            message: "Access Denied: Company ID mismatch.",
          });
        }

        // Validate Section and trace back to Company to verify tenant
        const section = await fastify.prisma.section.findFirst({
          where: { id: data.sectionId, deletedAt: null },
          include: {
            department: {
              include: {
                branch: {
                  select: { companyId: true },
                },
              },
            },
          },
        });

        if (!section) {
          return reply.status(404).send({
            success: false,
            message: "Section not found.",
          });
        }

        if (section.department.branch.companyId !== companyId) {
          return reply.status(403).send({
            success: false,
            message: "Access Denied: Section belongs to another tenant.",
          });
        }

        // Validate unique name within this section
        const existingDivision = await fastify.prisma.division.findUnique({
          where: {
            sectionId_name: {
              sectionId: data.sectionId,
              name: data.name,
            },
          },
        });

        if (existingDivision) {
          return reply.status(409).send({
            success: false,
            message: "A division with this name already exists in the section.",
          });
        }

        const division = await fastify.prisma.division.create({
          data,
        });

        adminLogs.info("Division created successfully", {
          divisionId: division.id,
          name: division.name,
        });

        return reply.status(201).send({
          success: true,
          message: "Division created successfully.",
          data: division,
        });
      } catch (error: any) {
        adminLogs.error("Division creation failed", { error });
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

export default createDivisionRoute;
