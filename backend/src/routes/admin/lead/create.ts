import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createLeadSchema } from "../../../schemas/admin/lead/lead.schema";

async function createLeadRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Lead"],
        summary: "Create Lead",
        description: "Creates a new sales opportunity lead.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------
        const validation = createLeadSchema.safeParse(request.body);

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
        const userId = request.admin?.id;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Validate Company
        //--------------------------------
        const company = await fastify.prisma.company.findUnique({
          where: { id: data.companyId },
        });
        if (!company || company.deletedAt) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        //--------------------------------
        // Validate Customer (if provided)
        //--------------------------------
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

        //--------------------------------
        // Validate Assigned User (if provided)
        //--------------------------------
        if (data.assignedToId) {
          const user = await fastify.prisma.user.findFirst({
            where: { id: data.assignedToId, deletedAt: null },
          });
          if (!user) {
            return reply.status(404).send({
              success: false,
              message: "Assigned user not found.",
            });
          }
        }

        //--------------------------------
        // Validate Creator Employee (if provided)
        //--------------------------------
        if (data.createdById) {
          const employee = await fastify.prisma.employee.findFirst({
            where: { id: data.createdById, deletedAt: null },
          });
          if (!employee) {
            return reply.status(404).send({
              success: false,
              message: "Creator employee not found.",
            });
          }
        }

        //--------------------------------
        // Create Lead & Log Activity
        //--------------------------------
        const lead = await fastify.prisma.$transaction(async (tx) => {
          const newLead = await tx.tenderRequest.create({
            data: {
              ...data,
              estimatedValue: data.estimatedValue ?? null,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: userId || null,
              module: "TenderRequest",
              recordId: newLead.id,
              action: "CREATE",
              newValue: JSON.parse(JSON.stringify(newLead)),
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"],
            },
          });

          return newLead;
        });

        adminLogs.info("Lead created successfully", {
          leadId: lead.id,
          title: lead.title,
        });

        return reply.status(201).send({
          success: true,
          message: "Lead created successfully.",
          data: lead,
        });
      } catch (error: any) {
        adminLogs.error("Lead creation failed", { error });
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

export default createLeadRoute;
