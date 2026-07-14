import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateCustomerSchema } from "../../../schemas/admin/customer/customer.schema";

async function updateCustomerRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Customer"],
        summary: "Update Customer",
        description: "Updates details of an existing customer.",
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
        const validation = updateCustomerSchema.safeParse(request.body);
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
        // Update Customer
        //--------------------------------
        await fastify.prisma.customer.update({
          where: { id },
          data: validation.data,
        });

        adminLogs.info("Customer updated successfully", {
          customerId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Customer updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Customer update failed", { error });
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

export default updateCustomerRoute;
