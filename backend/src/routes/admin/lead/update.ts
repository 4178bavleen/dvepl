import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateLeadSchema } from "../../../schemas/admin/lead/lead.schema";

async function updateLeadRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Lead"],
        summary: "Update Lead",
        description: "Updates details of an existing sales opportunity lead.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------
        const validation = updateLeadSchema.safeParse(request.body);
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

        //--------------------------------
        // Check Lead & Tenant
        //--------------------------------
        const existingLead = await fastify.prisma.lead.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!existingLead) {
          return reply.status(404).send({
            success: false,
            message: "Lead not found.",
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
        // Update Lead & Write Activities
        //--------------------------------
        await fastify.prisma.$transaction(async (tx) => {
          await tx.lead.update({
            where: { id },
            data: {
              ...data,
              estimatedValue: data.estimatedValue !== undefined ? (data.estimatedValue ?? null) : undefined,
            },
          });

          // Log status change
          if (data.status && data.status !== existingLead.status) {
            await tx.leadActivity.create({
              data: {
                leadId: id,
                activityType: "STATUS_CHANGE",
                remarks: `Lead status changed from ${existingLead.status} to ${data.status}`,
                performedBy: performerId,
              },
            });
          }

          // Log assignee change
          if (data.assignedToId && data.assignedToId !== existingLead.assignedToId) {
            await tx.leadActivity.create({
              data: {
                leadId: id,
                activityType: "FOLLOW_UP",
                remarks: `Lead reassigned to user ID: ${data.assignedToId}`,
                performedBy: performerId,
              },
            });
          }
        });

        adminLogs.info("Lead updated successfully", { leadId: id });

        return reply.status(200).send({
          success: true,
          message: "Lead updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Lead update failed", { error });
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

export default updateLeadRoute;
