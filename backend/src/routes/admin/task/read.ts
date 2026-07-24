import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminTaskReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Task"],
        summary: "Read Tasks",
        description: "Get all tasks",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tasks = await fastify.prisma.task.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            assignments: {
              include: {
                employee: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
        });

        // Format assignments to match tasksPage UI interface: { id, name }
        const formattedTasks = tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate.toISOString().split("T")[0],
          assignedUsers: t.assignments.map((a) => ({
            id: a.employee.user?.id || a.employee.id,
            name: a.employee.user?.name || `${a.employee.firstName} ${a.employee.lastName}`,
          })),
        }));

        return reply.status(200).send({
          success: true,
          message: "Tasks fetched successfully.",
          count: formattedTasks.length,
          data: formattedTasks,
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Task fetch failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching tasks.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminTaskReadRoutes;
