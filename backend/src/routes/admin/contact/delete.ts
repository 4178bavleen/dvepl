import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteContactRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Contact Person"],
        summary: "Soft Delete Customer Contact",
        description: "Soft deletes a customer contact person.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

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
        // Soft Delete
        //--------------------------------
        await fastify.prisma.contactPerson.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        adminLogs.info("Contact person soft deleted successfully", { contactId: id });

        return reply.status(200).send({
          success: true,
          message: "Contact person deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Contact person soft delete failed", { error });
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

export default deleteContactRoute;
