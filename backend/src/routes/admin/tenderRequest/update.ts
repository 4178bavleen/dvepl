import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateTenderRequestSchema } from "../../../schemas/admin/tenderRequest/tenderRequest.schema";

async function updateTenderRequestRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Tender Request"],
        summary: "Update Tender Request",
        description: "Updates details of an existing tender request.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tenderRequest.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateTenderRequestSchema.safeParse(request.body);
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
        const performerId = request.admin?.id || "System";

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const data = validation.data;

        // Check Tender Request & Tenant
        const existingTenderRequest = await fastify.prisma.tenderRequest.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!existingTenderRequest) {
          return reply.status(404).send({
            success: false,
            message: "Tender request not found.",
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

        // Update Tender Request & Write Activities
        await fastify.prisma.$transaction(async (tx) => {
          await tx.tenderRequest.update({
            where: { id },
            data: {
              ...data,
              estimatedValue: data.estimatedValue !== undefined ? (data.estimatedValue ?? null) : undefined,
            },
          });

          // Log status change
          if (data.status && data.status !== existingTenderRequest.status) {
            await tx.auditLog.create({
              data: {
                userId: performerId === "System" ? null : performerId,
                module: "TenderRequest",
                recordId: id,
                action: "STATUS_CHANGE",
                newValue: { remarks: `Tender request status changed from ${existingTenderRequest.status} to ${data.status}` },
                ipAddress: request.ip,
                userAgent: request.headers["user-agent"],
              },
            });
          }

          // Log assignee change
          if (data.assignedToId && data.assignedToId !== existingTenderRequest.assignedToId) {
            await tx.auditLog.create({
              data: {
                userId: performerId === "System" ? null : performerId,
                module: "TenderRequest",
                recordId: id,
                action: "FOLLOW_UP",
                newValue: { remarks: `Tender request reassigned to user ID: ${data.assignedToId}` },
                ipAddress: request.ip,
                userAgent: request.headers["user-agent"],
              },
            });
          }
        });

        adminLogs.info("Tender request updated successfully", { tenderRequestId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender request updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Tender request update failed", { error });
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

export default updateTenderRequestRoute;
