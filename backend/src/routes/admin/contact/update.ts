import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateContactPersonSchema } from "../../../schemas/admin/contact/contact.schema";

async function updateContactRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Contact Person"],
        summary: "Update Customer Contact",
        description: "Updates details of a customer contact person.",
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
        const validation = updateContactPersonSchema.safeParse(request.body);
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

        const { id } = request.params as { id: string };
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const data = validation.data;

        //--------------------------------
        // Check Contact & Tenant
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
        });

        if (!contact) {
          return reply.status(404).send({
            success: false,
            message: "Contact person not found.",
          });
        }

        //--------------------------------
        // Transaction & Primary Unset
        //--------------------------------
        await fastify.prisma.$transaction(async (tx) => {
          if (data.isPrimary) {
            await tx.contactPerson.updateMany({
              where: { customerId: contact.customerId, isPrimary: true },
              data: { isPrimary: false },
            });
          }

          await tx.contactPerson.update({
            where: { id },
            data,
          });
        });

        adminLogs.info("Contact person updated successfully", {
          contactId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Contact person updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Contact person update failed", { error });
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

export default updateContactRoute;
