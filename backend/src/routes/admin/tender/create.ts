import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createTenderSchema } from "../../../schemas/admin/tender/tender.schema";

async function createTenderRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tender"],
        summary: "Create Tender",
        description: "Creates a new tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createTenderSchema.safeParse(request.body);

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
        const userId = request.user?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Validate Company
        const company = await fastify.prisma.company.findUnique({
          where: { id: data.companyId },
        });
        if (!company || company.deletedAt) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        // Validate Lead
        if (data.leadId) {
          const lead = await fastify.prisma.lead.findFirst({
            where: { id: data.leadId, companyId, deletedAt: null },
          });
          if (!lead) {
            return reply.status(404).send({
              success: false,
              message: "Lead not found.",
            });
          }
        }

        // Validate Customer
        if (data.customerId) {
          const customer = await fastify.prisma.customer.findFirst({
            where: { id: data.customerId, companyId, deletedAt: null },
          });
          if (!customer) {
            return reply.status(404).send({
              success: false,
              message: "Customer not found.",
            });
          }
        }

        // Validate Department
        if (data.departmentId) {
          const department = await fastify.prisma.department.findFirst({
            where: { id: data.departmentId, deletedAt: null },
          });
          if (!department) {
            return reply.status(404).send({
              success: false,
              message: "Department not found.",
            });
          }
        }

        // Validate Section
        if (data.sectionId) {
          const section = await fastify.prisma.section.findFirst({
            where: { id: data.sectionId, deletedAt: null },
          });
          if (!section) {
            return reply.status(404).send({
              success: false,
              message: "Section not found.",
            });
          }
        }

        // Validate Division
        if (data.divisionId) {
          const division = await fastify.prisma.division.findFirst({
            where: { id: data.divisionId, deletedAt: null },
          });
          if (!division) {
            return reply.status(404).send({
              success: false,
              message: "Division not found.",
            });
          }
        }

        // Validate SubDivision
        if (data.subDivisionId) {
          const subDivision = await fastify.prisma.subDivision.findFirst({
            where: { id: data.subDivisionId, deletedAt: null },
          });
          if (!subDivision) {
            return reply.status(404).send({
              success: false,
              message: "SubDivision not found.",
            });
          }
        }

        // Validate GovernmentDepartment
        if (data.governmentDepartmentId) {
          const govtDept = await fastify.prisma.governmentDepartment.findFirst({
            where: { id: data.governmentDepartmentId, companyId },
          });
          if (!govtDept) {
            return reply.status(404).send({
              success: false,
              message: "Government department not found.",
            });
          }
        }

        // Validate Creator User
        const creatorUser = await fastify.prisma.user.findFirst({
          where: { id: data.createdById, deletedAt: null },
        });
        if (!creatorUser) {
          return reply.status(404).send({
            success: false,
            message: "Creator user not found.",
          });
        }

        // Validate Assigned User
        if (data.assignedToId) {
          const assignedUser = await fastify.prisma.user.findFirst({
            where: { id: data.assignedToId, deletedAt: null },
          });
          if (!assignedUser) {
            return reply.status(404).send({
              success: false,
              message: "Assigned user not found.",
            });
          }
        }

        // Validate Unique Tender Code
        if (data.tenderCode) {
          const existingTender = await fastify.prisma.tender.findUnique({
            where: { tenderCode: data.tenderCode },
          });
          if (existingTender) {
            return reply.status(409).send({
              success: false,
              message: "Tender code already exists.",
            });
          }
        }

        // Create Tender & Log Activity in Transaction
        const tender = await fastify.prisma.$transaction(async (tx) => {
          const newTender = await tx.tender.create({
            data: {
              ...data,
              estimatedCost: data.estimatedCost ?? null,
            },
          });

          await tx.tenderActivity.create({
            data: {
              tenderId: newTender.id,
              action: "CREATE",
              newValue: JSON.parse(JSON.stringify(newTender)),
              performedBy: userId || "System",
            },
          });

          return newTender;
        });

        adminLogs.info("Tender created successfully", {
          tenderId: tender.id,
          title: tender.title,
        });

        return reply.status(201).send({
          success: true,
          message: "Tender created successfully.",
          data: tender,
        });
      } catch (error: any) {
        adminLogs.error("Tender creation failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default createTenderRoute;
