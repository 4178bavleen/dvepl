import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readTenderRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all tenders
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tender"],
        summary: "Read Tenders",
        description: "Returns all active tenders for the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const tenders = await fastify.prisma.tender.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            lead: {
              select: { id: true, title: true },
            },
            customer: {
              select: { id: true, name: true },
            },
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
            governmentDepartment: {
              select: { id: true, name: true, shortName: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Tenders fetched successfully.",
          data: tenders,
        });
      } catch (error: any) {
        adminLogs.error("Read Tenders failed", { error });
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

  // Read tender by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tender"],
        summary: "Read Tender By Id",
        description: "Returns detailed information of a tender.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        const tender = await fastify.prisma.tender.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
          include: {
            lead: true,
            customer: true,
            department: true,
            section: true,
            division: true,
            subDivision: true,
            createdBy: {
              select: { id: true, name: true, email: true, phone: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true, phone: true },
            },
            governmentDepartment: true,
            files: {
              select: { id: true, fileName: true, fileUrl: true, fileType: true },
            },
            remarks: {
              include: {
                user: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "desc" },
            },
            activities: {
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!tender) {
          return reply.status(404).send({
            success: false,
            message: "Tender not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Tender details fetched successfully.",
          data: tender,
        });
      } catch (error: any) {
        adminLogs.error("Read Tender By Id failed", { error });
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

export default readTenderRoutes;
