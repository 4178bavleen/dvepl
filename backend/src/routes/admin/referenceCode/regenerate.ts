import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { regenerateReferenceCodeSchema } from "../../../schemas/admin/referenceCode/referenceCode.schema";
import { ReferenceCodeService } from "../../../services/referenceCodeService";

async function regenerateReferenceCodeRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/:tenderId",
    {
      schema: {
        tags: ["Reference Code"],
        summary: "Regenerate Tender Reference Code",
        description: "Increments sequence counter and regenerates reference code for an existing tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = regenerateReferenceCodeSchema.safeParse(request.body);

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

        const { tenderId } = request.params as { tenderId: string };
        const { prefix, reason } = validation.data;
        const companyId = request.admin?.companyId;
        const performerId = request.admin?.id || "System";

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Fetch Tender & Check Tenant
        const tender = await fastify.prisma.tender.findFirst({
          where: { id: tenderId, companyId, deletedAt: null },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        // Transaction block to regenerate code
        const newCodeRecord = await fastify.prisma.$transaction(async (tx) => {
          const prefixToUse = prefix || "TENDER";
          
          // Get the latest reference code logged for this tender
          const latestCodeRecord = await tx.referenceCode.findFirst({
            where: { tenderId },
            orderBy: { createdAt: "desc" },
          });
          const actualOldCode = latestCodeRecord?.newReferenceCode || null;

          const result = await ReferenceCodeService.generateNextCode(
            tx,
            companyId,
            prefixToUse
          );

          // Log in ReferenceCode logs
          const logRecord = await ReferenceCodeService.logAction(tx, {
            tenderId,
            oldReferenceCode: actualOldCode,
            newReferenceCode: result.formattedCode,
            actionType: "REGENERATED",
            actionReason: reason,
            actionBy: performerId,
          });

          // Log in TenderActivity
          await tx.tenderActivity.create({
            data: {
              tenderId,
              action: "UPDATE",
              oldValue: { referenceCode: actualOldCode },
              newValue: { referenceCode: result.formattedCode, reason },
              performedBy: performerId,
            },
          });

          return logRecord;
        });

        adminLogs.info("Reference code regenerated successfully", {
          tenderId,
          oldCode: newCodeRecord.oldReferenceCode,
          newCode: newCodeRecord.newReferenceCode,
        });

        return reply.status(200).send({
          success: true,
          message: "Reference code regenerated successfully.",
          data: {
            tenderId,
            oldReferenceCode: newCodeRecord.oldReferenceCode,
            newReferenceCode: newCodeRecord.newReferenceCode,
          },
        });
      } catch (error: any) {
        adminLogs.error("Regenerate reference code failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );
}

export default regenerateReferenceCodeRoute;
