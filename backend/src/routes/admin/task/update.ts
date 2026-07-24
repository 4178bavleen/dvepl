import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { taskSchema } from "../../../schemas/admin/task/task.schema";

async function adminTaskUpdateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.patch(
    "/:id",
    {
      schema: {
        tags: ["Task"],
        summary: "Update Task",
        description: "Update a task by ID",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;
        const validationResult = taskSchema.partial().safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid task update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid task update data.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const existingTask = await fastify.prisma.task.findFirst({
          where: { id, deletedAt: null },
        });

        if (!existingTask) {
          return reply.status(404).send({
            success: false,
            message: "Task not found or deleted.",
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

        await fastify.prisma.$transaction(async (tx) => {
          await tx.task.update({
            where: { id },
            data: {
              title: title !== undefined ? title : undefined,
              description: description !== undefined ? description : undefined,
              priority: priority !== undefined ? priority : undefined,
              dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
              status: status !== undefined ? status : undefined,
            },
          });

          if (assignedUserIds !== undefined) {
            await tx.taskAssignment.deleteMany({
              where: { taskId: id },
            });

            if (assignedUserIds.length > 0) {
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
                    taskId: id,
                    employeeId: emp.id
                  }))
                });
              }
            }
          }
        });

        adminLogs.info("Task updated successfully", { taskId: id });

        return reply.status(200).send({
          success: true,
          message: "Task updated successfully.",
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Task update failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating task.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminTaskUpdateRoutes;
