import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { contactPersonListQuerySchema } from "../../../schemas/admin/contact/contact.schema";

async function readContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all contacts matching customerId query param
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Contact Person"],
        summary: "List Customer Contacts",
        description: "Returns points of contact for a customer.",
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

        //--------------------------------
        // Query Validation
        //--------------------------------
        const validation = contactPersonListQuerySchema.safeParse(request.query);
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

        const { customerId } = validation.data;

        let contacts;
        if (customerId) {
          //--------------------------------
          // Tenant Verification
          //--------------------------------
          const customer = await fastify.prisma.customer.findFirst({
            where: { id: customerId, companyId, deletedAt: null },
          });

          if (!customer) {
            return reply.status(404).send({
              success: false,
              message: "Customer not found.",
            });
          }

          contacts = await fastify.prisma.contactPerson.findMany({
            where: { customerId, deletedAt: null },
            orderBy: { createdAt: "desc" },
          });
        } else {
          // Fetch all contacts for this company
          contacts = await fastify.prisma.contactPerson.findMany({
            where: {
              customer: {
                companyId,
                deletedAt: null,
              },
              deletedAt: null,
            },
            orderBy: { createdAt: "desc" },
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Customer contacts fetched successfully.",
          data: contacts,
        });
      } catch (error: any) {
        adminLogs.error("List Customer Contacts failed", { error });
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

  // Read contact person by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Contact Person"],
        summary: "Read Contact Details",
        description: "Returns detailed information of a customer contact person.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.view"]),
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

        //--------------------------------
        // Fetch Contact with tenant check
        //--------------------------------
        const contact = await fastify.prisma.contactPerson.findFirst({
          where: {
            id,
            deletedAt: null,
            customer: {
              companyId,
              deletedAt: null,
            },
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!contact) {
          return reply.status(404).send({
            success: false,
            message: "Contact person not found.",
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Contact person details fetched successfully.",
          data: contact,
        });
      } catch (error: any) {
        adminLogs.error("Read contact person details failed", { error });
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

export default readContactRoutes;
