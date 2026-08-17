import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { notificationRecipientUpdateSchema } from "../../../../schemas/admin/notification/notification.schema";

async function notificationRecipientUpdate(
  fastify: FastifyInstance,
) {
  fastify.put(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const validationResult = notificationRecipientUpdateSchema.partial().safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Invalid recipient update payload.",
          error: validationResult.error.issues,
        });
      }

      const existing = await fastify.prisma.notificationRecipient.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          message: "Notification recipient not found.",
        });
      }

      const updated = await fastify.prisma.notificationRecipient.update({
        where: { id },
        data: validationResult.data,
      });

      return reply.send({
        success: true,
        message: "Notification recipient updated successfully.",
        data: updated,
      });
    }
  );
}

export default notificationRecipientUpdate;
