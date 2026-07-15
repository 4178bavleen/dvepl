import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateReferenceCodeCounterSchema } from "../../../schemas/admin/referenceCodeCounter/referenceCodeCounter.schema";

async function updateCounterRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Reference Code Counter"],
        summary: "Update Reference Code Counter",
        description: "Updates details or overrides sequence value of a counter.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["tender.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validation = updateReferenceCodeCounterSchema.safeParse(request.body);

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

        const existingCounter = await fastify.prisma.referenceCodeCounter.findFirst({
          where: { id, companyId },
        });

        if (!existingCounter) {
          return reply.status(404).send({
            success: false,
            message: "Reference code counter not found.",
          });
        }

        const data = validation.data;

        // If prefix is being renamed, check duplicates
        if (data.prefix && data.prefix !== existingCounter.prefix) {
          const duplicate = await fastify.prisma.referenceCodeCounter.findUnique({
            where: {
              companyId_prefix: {
                companyId,
                prefix: data.prefix,
              },
            },
          });

          if (duplicate) {
            return reply.status(409).send({
              success: false,
              message: `Counter for prefix "${data.prefix}" already exists for this company.`,
            });
          }
        }

        const updatedCounter = await fastify.prisma.referenceCodeCounter.update({
          where: { id },
          data,
        });

        adminLogs.info("Reference code counter updated successfully", {
          counterId: id,
          companyId,
        });

        return reply.status(200).send({
          success: true,
          message: "Reference code counter updated successfully.",
          data: updatedCounter,
        });
      } catch (error: any) {
        adminLogs.error("Update reference code counter failed", { error });
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

export default updateCounterRoute;
