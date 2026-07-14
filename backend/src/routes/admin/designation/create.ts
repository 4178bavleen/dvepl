import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createDesignationSchema } from "../../../schemas/admin/designation/designation.schema";

async function createDesignationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Designation"],
        summary: "Create Designation",
        description: "Create a new designation",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createDesignationSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid designation data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid designation data.",
            error: validationResult.error.issues,
          });
        }

        const { title, level } = validationResult.data;

        // Check if title already exists (including soft-deleted ones)
        const existingDesignation = await fastify.prisma.designation.findUnique({
          where: {
            title,
          },
        });

        if (existingDesignation) {
          if (existingDesignation.deletedAt) {
            return reply.status(409).send({
              success: false,
              message: "A designation with this title already exists (inactive/deleted). Please restore it or use a different title.",
            });
          }

          return reply.status(409).send({
            success: false,
            message: "Designation title already exists.",
          });
        }

        const designation = await fastify.prisma.designation.create({
          data: {
            title,
            level,
          },
        });

        adminLogs.info("Designation created successfully", {
          designationId: designation.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Designation created successfully.",
          data: designation,
        });
      } catch (error: any) {
        adminLogs.error("Designation creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating designation.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createDesignationRoutes;
