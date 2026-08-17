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
        const userId = (request.admin as any)?.id;
        const roles = (request.admin as any)?.roles || [];
        const pageAccess = (request.admin as any)?.uiAccessProfile?.pageAccess || [];
        const isManager = roles.some((r: string) => r.toLowerCase().includes("admin")) || pageAccess.includes("tasks") || pageAccess.includes("employees");

        let whereClause: any = {
          deletedAt: null,
        };

        if (!isManager) {
          const employee = await fastify.prisma.employee.findFirst({
            where: {
              userId: userId,
              deletedAt: null,
            },
          });

          if (!employee) {
            return reply.status(200).send({
              success: true,
              message: "No tasks found (no employee record associated with user).",
              count: 0,
              data: [],
            });
          }

          whereClause.assignments = {
            some: {
              employeeId: employee.id,
            },
          };
        }

        const tasks = await fastify.prisma.task.findMany({
          where: whereClause,
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

        // Attach EAV Custom Field Values
        const { CustomFieldService } = await import("../../../services/customFieldService");
        const cfService = new CustomFieldService(fastify.prisma);
        const entityIds = tasks.map(t => t.id);
        const cfValuesMap = await cfService.getValuesForEntities("task", entityIds);

        // Format assignments to match tasksPage UI interface: { id, name }
        const formattedTasks = tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate.toISOString().split("T")[0],
          assignedUsers: t.assignments.map((a) => ({
            id: a.employee.user?.id || a.employee.id,
            name: a.employee.user?.name || `${a.employee.firstName} ${a.employee.lastName}`,
          })),
          customFields: cfValuesMap[t.id] || {}
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
