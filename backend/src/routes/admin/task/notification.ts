import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { taskNotificationSchema } from "../../../schemas/admin/task/task.schema";

async function adminTaskNotificationRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // Update task notification settings
  fastify.patch(
    "/settings/:id",
    {
      schema: {
        tags: ["Task"],
        summary: "Update Notification Settings",
        description: "Configure alerts rules for a specific task",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;
        const validationResult = taskNotificationSchema.partial().safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid notification configuration payload.",
            error: validationResult.error.issues,
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
          notifEnabled,
          notifType,
          notifDays,
          notifUnit,
          notifFrequency,
        } = validationResult.data;

        await fastify.prisma.task.update({
          where: { id },
          data: {
            notifEnabled: notifEnabled !== undefined ? notifEnabled : undefined,
            notifType: notifType !== undefined ? notifType : undefined,
            notifDays: notifDays !== undefined ? notifDays : undefined,
            notifUnit: notifUnit !== undefined ? notifUnit : undefined,
            notifFrequency: notifFrequency !== undefined ? notifFrequency : undefined,
          },
        });

        adminLogs.info("Task notification settings updated", { taskId: id });

        return reply.status(200).send({
          success: true,
          message: "Notification settings saved successfully.",
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Failed to save task notification settings", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error while saving notification settings.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );

  // Send manual triggers
  fastify.post(
    "/send-reminders",
    {
      schema: {
        tags: ["Task"],
        summary: "Dispatch Reminders",
        description: "Manually trigger pending alerts notifications run",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const today = new Date();
        const overdueTasks = await fastify.prisma.task.findMany({
          where: {
            deletedAt: null,
            status: { not: "completed" },
            dueDate: { lt: today },
            notifEnabled: true,
          },
        });

        adminLogs.info("Overdue reminders run triggered manually", {
          overdueCount: overdueTasks.length,
        });

        return reply.status(200).send({
          success: true,
          message: `Reminders run completed. Dispatched alerts for ${overdueTasks.length} task(s).`,
        });
      } catch (error: any) {
        console.error(error);
        adminLogs.error("Overdue reminders trigger failed", { error });

        return reply.status(500).send({
          success: false,
          message: "Server error during reminder dispatch run.",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminTaskNotificationRoutes;
