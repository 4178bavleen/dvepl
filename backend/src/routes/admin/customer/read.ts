import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readCustomerRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all customers
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Customer"],
        summary: "Read Customers",
        description:
          "Returns all active customers of the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.view"]),
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

        const customers = await fastify.prisma.customer.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Customers fetched successfully.",
          data: customers,
        });
      } catch (error: any) {
        adminLogs.error("Read Customers failed", { error });

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

  // Read customer by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Customer"],
        summary: "Read Customer By Id",
        description:
          "Returns detailed information of a customer, including contacts and communications.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.view"]),
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

        const { id } = request.params as { id: string };

        const customer = await fastify.prisma.customer.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
          include: {
            contacts: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: "desc",
              },
            },
            communicationLogs: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        if (!customer) {
          return reply.status(404).send({
            success: false,
            message: "Customer not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Customer fetched successfully.",
          data: customer,
        });
      } catch (error: any) {
        adminLogs.error("Read Customer By Id failed", { error });

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

export default readCustomerRoutes;