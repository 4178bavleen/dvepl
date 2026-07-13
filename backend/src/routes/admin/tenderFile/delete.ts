import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteTenderFileRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Tender File"],
        summary: "Remove Tender File",
        description: "Removes an attached file from a tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const companyId = request.user?.companyId;
        const userId = request.user?.id || "System";

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // Fetch file and verify tenant
        const tenderFile = await fastify.prisma.tenderFile.findFirst({
          where: { id },
          include: {
            tender: {
              select: { companyId: true },
            },
          },
        });

        if (!tenderFile || tenderFile.tender.companyId !== companyId) {
          return reply.status(404).send({
            success: false,
            message: "Tender file not found.",
          });
        }

        // Delete file metadata
        await fastify.prisma.tenderFile.delete({
          where: { id },
        });

        // Log Tender Activity
        await fastify.prisma.tenderActivity.create({
          data: {
            tenderId: tenderFile.tenderId,
            action: "UPDATE",
            oldValue: { removedFile: tenderFile.fileName },
            performedBy: userId,
          },
        });

        adminLogs.info("Tender file deleted successfully", { tenderFileId: id });

        return reply.status(200).send({
          success: true,
          message: "Tender file removed successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Tender file delete failed", { error });
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

export default deleteTenderFileRoute;
