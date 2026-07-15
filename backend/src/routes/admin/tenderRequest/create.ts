import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createTenderRequestSchema } from "../../../schemas/admin/tenderRequest/tenderRequest.schema";

async function createTenderRequestRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tender Request"],
        summary: "Create Tender Request",
        description: "Creates a new tender request.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createTenderRequestSchema.safeParse(request.body);

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

        // Validate Customer (if provided)
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

        // Validate Assigned User (if provided)
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

        // Validate Creator Employee (if provided)
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

        // Create Tender Request & Log Activity
        const tenderRequest = await fastify.prisma.$transaction(async (tx) => {
          const newTenderRequest = await tx.tenderRequest.create({
            data: {
              ...data,
              estimatedValue: data.estimatedValue ?? null,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: userId || null,
              module: "TenderRequest",
              recordId: newTenderRequest.id,
              action: "CREATE",
              newValue: JSON.parse(JSON.stringify(newTenderRequest)),
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"],
            },
          });

          return newTenderRequest;
        });

        adminLogs.info("Tender request created successfully", {
          tenderRequestId: tenderRequest.id,
          title: tenderRequest.title,
        });

        return reply.status(201).send({
          success: true,
          message: "Tender request created successfully.",
          data: tenderRequest,
        });
      } catch (error: any) {
        adminLogs.error("Tender request creation failed", { error });
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

export default createTenderRequestRoute;
