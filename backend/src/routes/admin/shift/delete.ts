import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteShiftRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Shift"],
        summary: "Delete Shift",
        description: "Soft delete a shift definition.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
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

        await fastify.prisma.shift.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        adminLogs.info("Shift deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          shiftId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Shift deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Shift Failed", { error });
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

export default deleteShiftRoute;
