import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createContactPersonSchema } from "../../../schemas/admin/contact/contact.schema";

async function createContactRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Contact Person"],
        summary: "Create Customer Contact",
        description: "Creates a new contact person for a customer.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------
        const validation = createContactPersonSchema.safeParse(request.body);

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

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Check Customer & Tenant
        //--------------------------------
        const customer = await fastify.prisma.customer.findFirst({
          where: { id: data.customerId, companyId, deletedAt: null },
        });

        if (!customer) {
          return reply.status(404).send({
            success: false,
            message: "Customer not found.",
          });
        }

        //--------------------------------
        // Transaction & Primary Unset
        //--------------------------------
        const contact = await fastify.prisma.$transaction(async (tx) => {
          if (data.isPrimary) {
            await tx.contactPerson.updateMany({
              where: { customerId: data.customerId, isPrimary: true },
              data: { isPrimary: false },
            });
          }

          return await tx.contactPerson.create({
            data,
          });
        });

        adminLogs.info("Contact person created successfully", {
          contactId: contact.id,
          customerId: contact.customerId,
        });

        return reply.status(201).send({
          success: true,
          message: "Contact person created successfully.",
          data: contact,
        });
      } catch (error: any) {
        adminLogs.error("Contact person creation failed", { error });
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

export default createContactRoute;
