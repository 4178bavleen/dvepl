import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateTenderSchema } from "../../../schemas/admin/tender/tender.schema";

async function updateTenderRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Tender"],
        summary: "Update Tender",
        description: "Updates details of an existing tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateTenderSchema.safeParse(request.body);
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
        const performerId = request.user?.id || "System";

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const data = validation.data;

        // Fetch Existing Tender
        const existingTender = await fastify.prisma.tender.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!existingTender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
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

        // Validate Creator User
        if (data.createdById) {
          const creatorUser = await fastify.prisma.user.findFirst({
            where: { id: data.createdById, deletedAt: null },
          });
          if (!creatorUser) {
            return reply.status(404).send({
              success: false,
              message: "Creator user not found.",
            });
          }
        }

        // Validate Unique Tender Code
        if (data.tenderCode && data.tenderCode !== existingTender.tenderCode) {
          const existingTenderCode = await fastify.prisma.tender.findUnique({
            where: { tenderCode: data.tenderCode },
          });
          if (existingTenderCode) {
            return reply.status(409).send({
              success: false,
              message: "Tender code already exists.",
            });
          }
        }

        // Update Tender & Write Activities
        const updatedTender = await fastify.prisma.$transaction(async (tx) => {
          const tender = await tx.tender.update({
            where: { id },
            data: {
              ...data,
              estimatedCost: data.estimatedCost !== undefined ? (data.estimatedCost ?? null) : undefined,
            },
          });

          // Log status change or general update
          const action = data.status && data.status !== existingTender.status ? "STATUS_CHANGE" : "UPDATE";

          const changedKeys = Object.keys(data).filter(
            (key) => (data as any)[key] !== (existingTender as any)[key]
          );

          if (changedKeys.length > 0) {
            const oldValue: any = {};
            const newValue: any = {};
            changedKeys.forEach((key) => {
              oldValue[key] = (existingTender as any)[key];
              newValue[key] = (data as any)[key];
            });

            await tx.tenderActivity.create({
              data: {
                tenderId: id,
                action,
                oldValue,
                newValue,
                performedBy: performerId,
              },
            });
          }

          return tender;
        });

        adminLogs.info("Tender updated successfully", { tenderId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender updated successfully.",
          data: updatedTender,
        });
      } catch (error: any) {
        adminLogs.error("Tender update failed", { error });
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

export default updateTenderRoute;
