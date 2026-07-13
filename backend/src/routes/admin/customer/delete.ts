import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteCustomerRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Customer"],
        summary: "Delete Customer",
        description: "Soft deletes a customer account.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.delete"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };
        const companyId = request.user?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //--------------------------------
        // Check Customer
        //--------------------------------
        const customer = await fastify.prisma.customer.findFirst({
          where: { id, companyId, deletedAt: null },
        });

        if (!customer) {
          return reply.status(404).send({
            success: false,
            message: "Customer not found.",
          });
        }

        //--------------------------------
        // Soft Delete Customer & Contacts
        //--------------------------------
        await fastify.prisma.$transaction(async (tx) => {
          await tx.customer.update({
            where: { id },
            data: { deletedAt: new Date() },
          });

          await tx.contactPerson.updateMany({
            where: { customerId: id, deletedAt: null },
            data: { deletedAt: new Date() },
          });
        });

        adminLogs.info("Customer soft deleted successfully", { customerId: id });

        return reply.status(200).send({
          success: true,
          message: "Customer deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Customer soft delete failed", { error });
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

export default deleteCustomerRoute;
