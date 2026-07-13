import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createSectionSchema } from "../../../schemas/admin/section/section.schema";

async function createSectionRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Section"],
        summary: "Create Section",
        description: "Creates a new organizational section.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createSectionSchema.safeParse(request.body);

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

        // Validate Department and trace back to Company to verify tenant
        const department = await fastify.prisma.department.findFirst({
          where: { id: data.departmentId, deletedAt: null },
          include: {
            branch: {
              select: { companyId: true },
            },
          },
        });

        if (!department) {
          return reply.status(404).send({
            success: false,
            message: "Department not found.",
          });
        }

        if (department.branch.companyId !== companyId) {
          return reply.status(403).send({
            success: false,
            message: "Access Denied: Department belongs to another tenant.",
          });
        }

        // Validate unique name within this department
        const existingSection = await fastify.prisma.section.findUnique({
          where: {
            departmentId_name: {
              departmentId: data.departmentId,
              name: data.name,
            },
          },
        });

        if (existingSection) {
          return reply.status(409).send({
            success: false,
            message: "A section with this name already exists in the department.",
          });
        }

        const section = await fastify.prisma.section.create({
          data,
        });

        adminLogs.info("Section created successfully", {
          sectionId: section.id,
          name: section.name,
        });

        return reply.status(201).send({
          success: true,
          message: "Section created successfully.",
          data: section,
        });
      } catch (error: any) {
        adminLogs.error("Section creation failed", { error });
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

export default createSectionRoute;
