import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readShiftRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all shifts
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Shift"],
        summary: "Read Shifts",
        description: "Returns all active shift definitions.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const shifts = await fastify.prisma.shift.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: {
            name: "asc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Shifts fetched successfully.",
          data: shifts,
        });
      } catch (error: any) {
        adminLogs.error("Read Shifts Failed", { error });
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

  // Read shift by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Shift"],
        summary: "Read Shift By Id",
        description: "Returns shift details.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const shift = await fastify.prisma.shift.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!shift) {
          return reply.status(404).send({
            success: false,
            message: "Shift not found.",
          });
        }

        return reply.send({
          success: true,
          data: shift,
        });
      } catch (error: any) {
        adminLogs.error("Read Shift By Id Failed", { error });
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

export default readShiftRoutes;
