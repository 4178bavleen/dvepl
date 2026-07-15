import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { referenceCodeListQuerySchema } from "../../../schemas/admin/referenceCode/referenceCode.schema";

async function readReferenceCodeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all reference code actions logs for the company
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Reference Code"],
        summary: "Read Reference Code Logs",
        description: "Returns action history logs of reference code modifications.",
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

        const validation = referenceCodeListQuerySchema.safeParse(request.query);
        if (!validation.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid query parameters.",
            error:
              process.env.NODE_ENV === "development"
                ? validation.error.issues
                : undefined,
          });
        }

        const { tenderId } = validation.data;

        const logs = await fastify.prisma.referenceCode.findMany({
          where: {
            tender: {
              companyId,
            },
            tenderId: tenderId || undefined,
          },
          include: {
            tender: {
              select: {
                id: true,
                title: true,
                tenderCode: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Reference code logs fetched successfully.",
          data: logs,
        });
      } catch (error: any) {
        adminLogs.error("Read reference code logs failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );

  // Read log by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Reference Code"],
        summary: "Get Reference Code Log Details",
        description: "Returns details of a specific reference code history log.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;
        const { id } = request.params as { id: string };

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const log = await fastify.prisma.referenceCode.findFirst({
          where: {
            id,
            tender: {
              companyId,
            },
          },
          include: {
            tender: {
              select: {
                id: true,
                title: true,
                tenderCode: true,
              },
            },
          },
        });

        if (!log) {
          return reply.status(404).send({
            success: false,
            message: "Reference code log not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Reference code log details fetched successfully.",
          data: log,
        });
      } catch (error: any) {
        adminLogs.error("Read reference code log details failed", { error });
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

export default readReferenceCodeRoutes;
