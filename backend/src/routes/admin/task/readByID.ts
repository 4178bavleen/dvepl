import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { isAdminUser, getEmployeeForUser } from "./access";

async function adminTaskReadByIdRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Task"],
        summary: "Read Task by ID",
        description: "Get a specific task by its ID",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;

        const task = await fastify.prisma.task.findFirst({
          where: {
            id,
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
        });

        if (!task) {
          return reply.status(404).send({
            success: false,
            message: "Task not found.",
          });
        }

        const userId = (request.admin as any)?.id;
        const isManager = isAdminUser(request.admin);

        if (!isManager) {
          const employee = await getEmployeeForUser(fastify, userId);

          if (!employee) {
            return reply.status(403).send({
              success: false,
              message: "Access denied: employee record not found.",
            });
          }

          const isAssigned = task.assignments.some(
            a => a.employeeId === employee.id || a.employee?.user?.id === userId
          );
          if (!isAssigned) {
            return reply.status(403).send({
              success: false,
              message: "Access denied: you are not assigned to this task.",
            });
          }
        }

        // Fetch Notification Logs for this task
        const notifLogs = await fastify.prisma.notificationLog.findMany({
          where: {
            OR: [
              { relatedRecordId: id },
              { relatedModule: "TASK", relatedRecordId: id },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const latestLog = notifLogs[0] || null;
        const hasSent = notifLogs.some((l) => l.status === "SENT");
        const hasFailed = notifLogs.some((l) => l.status === "FAILED");

        const formattedTask = {
          ...task,
          dueDate: task.dueDate.toISOString().split("T")[0],
          assignedUsers: task.assignments.map((a) => ({
            id: a.employee.user?.id || a.employee.id,
            name: a.employee.user?.name || `${a.employee.firstName} ${a.employee.lastName}`,
            email: a.employee.user?.email || null,
          })),
          mailDelivery: {
            status: hasSent ? "SENT" : hasFailed ? "FAILED" : "NOT_SENT",
            sentAt: latestLog ? (latestLog.sentAt || latestLog.createdAt) : null,
            recipient: latestLog?.recipient || null,
            error: latestLog?.error || null,
            logs: notifLogs,
          },
        };

        return reply.status(200).send({
          success: true,
          message: "Task fetched successfully.",
          data: formattedTask,
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Task read by ID failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while fetching task details.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminTaskReadByIdRoutes;
