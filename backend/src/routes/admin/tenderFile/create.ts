import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createTenderFileSchema } from "../../../schemas/admin/tenderFile/tenderFile.schema";

async function createTenderFileRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tender File"],
        summary: "Attach Tender File",
        description: "Attaches a new file metadata record to an existing tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createTenderFileSchema.safeParse(request.body);

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

        // Validate Tender and verify tenant
        const tender = await fastify.prisma.tender.findFirst({
          where: { id: data.tenderId, companyId, deletedAt: null },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        const tenderFile = await fastify.prisma.tenderFile.create({
          data: {
            ...data,
            uploadedBy: data.uploadedBy || userId || "System",
          },
        });

        // Log Tender Activity
        await fastify.prisma.tenderActivity.create({
          data: {
            tenderId: data.tenderId,
            action: "UPDATE",
            newValue: { attachedFile: tenderFile.fileName },
            performedBy: userId || "System",
          },
        });

        adminLogs.info("Tender file attached successfully", {
          tenderFileId: tenderFile.id,
          tenderId: data.tenderId,
        });

        return reply.status(201).send({
          success: true,
          message: "Tender file attached successfully.",
          data: tenderFile,
        });
      } catch (error: any) {
        adminLogs.error("Tender file attachment failed", { error });
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

export default createTenderFileRoute;
