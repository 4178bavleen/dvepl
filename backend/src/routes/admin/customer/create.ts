import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createCustomerSchema } from "../../../schemas/admin/customer/customer.schema";

async function createCustomerRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Customer"],
        summary: "Create Customer",
        description: "Creates a new customer account.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["customer.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        //--------------------------------
        // Validation
        //--------------------------------
        const validation = createCustomerSchema.safeParse(request.body);

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

        //--------------------------------
        // Check Company
        //--------------------------------
        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const company = await fastify.prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company || company.deletedAt) {
          return reply.status(404).send({
            success: false,
            message: "Company not found.",
          });
        }

        //--------------------------------
        // Create Customer
        //--------------------------------
        const customer = await fastify.prisma.customer.create({
          data: {
            ...data,
            companyId,
          },
        });

        adminLogs.info("Customer created successfully", {
          customerId: customer.id,
          name: customer.name,
        });

        return reply.status(201).send({
          success: true,
          message: "Customer created successfully.",
          data: customer,
        });
      } catch (error: any) {
        adminLogs.error("Customer creation failed", { error });
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

export default createCustomerRoute;
