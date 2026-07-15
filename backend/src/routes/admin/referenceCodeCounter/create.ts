import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createReferenceCodeCounterSchema } from "../../../schemas/admin/referenceCodeCounter/referenceCodeCounter.schema";

async function createCounterRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Reference Code Counter"],
        summary: "Create Reference Code Counter",
        description: "Creates a new sequence counter for a company and prefix.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = createReferenceCodeCounterSchema.safeParse(request.body);

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

        const { companyId, prefix, lastSequence } = validation.data;
        const jwtCompanyId = request.admin?.companyId;

        // Tenant Check
        if (companyId !== jwtCompanyId) {
          return reply.status(403).send({
            success: false,
            message: "Access denied. Cannot create counters for other companies.",
          });
        }

        // Check duplicate
        const existingCounter = await fastify.prisma.referenceCodeCounter.findUnique({
          where: {
            companyId_prefix: {
              companyId,
              prefix,
            },
          },
        });

        if (existingCounter) {
          return reply.status(409).send({
            success: false,
            message: `Counter for prefix "${prefix}" already exists for this company.`,
          });
        }

        const counter = await fastify.prisma.referenceCodeCounter.create({
          data: {
            companyId,
            prefix,
            lastSequence,
          },
        });

        adminLogs.info("Reference code counter created successfully", {
          counterId: counter.id,
          companyId,
          prefix,
        });

        return reply.status(201).send({
          success: true,
          message: "Reference code counter created successfully.",
          data: counter,
        });
      } catch (error: any) {
        adminLogs.error("Create reference code counter failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server Error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    }
  );
}

export default createCounterRoute;
