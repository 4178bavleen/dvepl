import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createShiftSchema } from "../../../schemas/admin/shift/shift.schema";

async function createShiftRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Shift"],
        summary: "Create Shift",
        description: "Create a new shift definition.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createShiftSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid shift data.",
            error: validationResult.error.issues,
          });
        }

        const { name, startTime, endTime } = validationResult.data;

        // Check for duplicate shift name
        const existingShift = await fastify.prisma.shift.findFirst({
          where: {
            name,
            deletedAt: null,
          },
        });

        if (existingShift) {
          return reply.status(409).send({
            success: false,
            message: "Shift name already exists.",
          });
        }

        const shift = await fastify.prisma.shift.create({
          data: {
            name,
            startTime,
            endTime,
          },
        });

        adminLogs.info("Shift created successfully", {
          createdBy: (request.user as any)?.id,
          shiftId: shift.id,
          name,
        });

        return reply.status(201).send({
          success: true,
          message: "Shift created successfully.",
          data: shift,
        });
      } catch (error: any) {
        adminLogs.error("Create Shift Failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default createShiftRoutes;
