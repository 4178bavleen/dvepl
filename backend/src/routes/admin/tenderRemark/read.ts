import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readTenderRemarkRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all remarks for a specific tender
  fastify.get(
    "/:tenderId",
    {
      schema: {
        tags: ["Tender Remark"],
        summary: "Read Tender Remarks",
        description: "Returns all remarks for a specific tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { tenderId } = request.params as { tenderId: string };

        // Verify tender belongs to company
        const tender = await fastify.prisma.tender.findFirst({
          where: { id: tenderId, companyId, deletedAt: null },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        const remarks = await fastify.prisma.tenderRemark.findMany({
          where: {
            tenderId,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Tender remarks fetched successfully.",
          data: remarks,
        });
      } catch (error: any) {
        adminLogs.error("Read tender remarks failed", { error });
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

export default readTenderRemarkRoutes;
