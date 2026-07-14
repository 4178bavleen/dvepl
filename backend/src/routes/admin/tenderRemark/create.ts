import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createTenderRemarkSchema } from "../../../schemas/admin/tenderRemark/tenderRemark.schema";

async function createTenderRemarkRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Tender Remark"],
        summary: "Create Tender Remark",
        description: "Adds a new comment/remark to a tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createTenderRemarkSchema.safeParse(request.body);

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

        const remark = await fastify.prisma.tenderRemark.create({
          data: {
            tenderId: data.tenderId,
            userId: userId || data.userId || null,
            remark: data.remark,
          },
        });

        adminLogs.info("Tender remark posted successfully", {
          tenderRemarkId: remark.id,
          tenderId: data.tenderId,
        });

        return reply.status(201).send({
          success: true,
          message: "Tender remark posted successfully.",
          data: remark,
        });
      } catch (error: any) {
        adminLogs.error("Tender remark creation failed", { error });
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

export default createTenderRemarkRoute;
