import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminTaskDeleteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Task"],
        summary: "Delete Task",
        description: "Soft delete a task by ID",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;

        const existingTask = await fastify.prisma.task.findFirst({
          where: { id, deletedAt: null },
        });

        if (!existingTask) {
          return reply.status(404).send({
            success: false,
            message: "Task not found or already deleted.",
          });
        }

        await fastify.prisma.task.update({
          where: { id },
          data: {
            deletedAt: new Date(),
          },
        });

        adminLogs.info("Task deleted successfully", { taskId: id });

        return reply.status(200).send({
          success: true,
          message: "Task deleted successfully.",
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Task delete failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while deleting task.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminTaskDeleteRoutes;
