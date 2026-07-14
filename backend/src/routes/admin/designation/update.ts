import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateDesignationSchema } from "../../../schemas/admin/designation/designation.schema";

interface Params {
  id: string;
}

async function updateDesignationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Designation"],
        summary: "Update Designation",
        description: "Update details of an existing designation.",
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const validationResult = updateDesignationSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid designation update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid designation data.",
            error: validationResult.error.issues,
          });
        }

        const { title, level } = validationResult.data;

        // Verify designation exists and is active
        const existingDesignation = await fastify.prisma.designation.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingDesignation) {
          return reply.status(404).send({
            success: false,
            message: "Designation not found.",
          });
        }

        // Verify title uniqueness if it is changing
        if (title && title !== existingDesignation.title) {
          const duplicateDesignation = await fastify.prisma.designation.findUnique({
            where: {
              title,
            },
          });

          if (duplicateDesignation) {
            return reply.status(409).send({
              success: false,
              message: "Designation title already exists.",
            });
          }
        }

        const updatedDesignation = await fastify.prisma.designation.update({
          where: {
            id,
          },
          data: {
            title,
            level,
          },
        });

        adminLogs.info("Designation updated successfully", {
          designationId: updatedDesignation.id,
          updatedBy: request.admin?.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Designation updated successfully.",
          data: updatedDesignation,
        });
      } catch (error: any) {
        adminLogs.error("Designation update failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating designation.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updateDesignationRoutes;
