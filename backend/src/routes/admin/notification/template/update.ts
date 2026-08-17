import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { notificationTemplateUpdateSchema } from "../../../../schemas/admin/notification/notification.schema";

async function notificationTemplateUpdate(
  fastify: FastifyInstance,
) {
  fastify.put(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const validationResult = notificationTemplateUpdateSchema.partial().safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Invalid template update payload.",
          error: validationResult.error.issues,
        });
      }

      const existing = await fastify.prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          message: "Notification template not found.",
        });
      }

      const updated = await fastify.prisma.notificationTemplate.update({
        where: { id },
        data: validationResult.data,
      });

      return reply.send({
        success: true,
        message: "Notification template updated successfully.",
        data: updated,
      });
    }
  );
}

export default notificationTemplateUpdate;
