import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readLeadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all leads
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Lead"],
        summary: "Read Leads",
        description: "Returns all active leads for the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Company From JWT
        //--------------------------------
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Fetch Leads
        //--------------------------------
        const leads = await fastify.prisma.lead.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            customer: {
              select: { id: true, name: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Leads fetched successfully.",
          data: leads,
        });
      } catch (error: any) {
        adminLogs.error("Read Leads failed", { error });
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

  // Read lead by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Lead"],
        summary: "Read Lead By Id",
        description: "Returns detailed information of a lead, including customer, assignee, and activity history.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["lead.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Company From JWT
        //--------------------------------
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        //--------------------------------
        // Fetch Lead
        //--------------------------------
        const lead = await fastify.prisma.lead.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
          include: {
            customer: {
              include: {
                contacts: {
                  where: { deletedAt: null, isPrimary: true },
                },
              },
            },
            assignedTo: {
              select: { id: true, name: true, email: true, phone: true },
            },
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            activities: {
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!lead) {
          return reply.status(404).send({
            success: false,
            message: "Lead not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Lead details fetched successfully.",
          data: lead,
        });
      } catch (error: any) {
        adminLogs.error("Read Lead By Id failed", { error });
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

export default readLeadRoutes;
