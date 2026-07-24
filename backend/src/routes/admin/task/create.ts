import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { taskSchema } from "../../../schemas/admin/task/task.schema";

async function adminTaskCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Task"],
        summary: "Create Task",
        description: "Create a new task",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = taskSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid task data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid task data.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const {
          title,
          description,
          priority,
          dueDate,
          status,
          assignedUserIds,
        } = validationResult.data;

        const task = await fastify.prisma.$transaction(async (tx) => {
          const createdTask = await tx.task.create({
            data: {
              title,
              description: description ?? null,
              priority: priority ?? "medium",
              dueDate: new Date(dueDate),
              status: status ?? "pending",
              notifEnabled: true,
              notifType: "automatic",
              notifDays: 1,
              notifUnit: "days",
              notifFrequency: "once",
            },
          });

          if (assignedUserIds && assignedUserIds.length > 0) {
            const employees = await tx.employee.findMany({
              where: {
                OR: [
                  { userId: { in: assignedUserIds } },
                  { id: { in: assignedUserIds } }
                ]
              },
              select: { id: true }
            });

            if (employees.length > 0) {
              await tx.taskAssignment.createMany({
                data: employees.map(emp => ({
                  taskId: createdTask.id,
                  employeeId: emp.id
                }))
              });
            }
          }

          return createdTask;
        });

        adminLogs.info("Task created successfully", {
          taskId: task.id,
          taskTitle: task.title,
        });

        return reply.status(201).send({
          success: true,
          message: "Task created successfully.",
          data: task,
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Task creation failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating task.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminTaskCreateRoutes;
