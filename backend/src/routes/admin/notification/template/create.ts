import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { notificationTemplateCreateSchema } from "../../../../schemas/admin/notification/notification.schema";

async function notificationTemplateCreate(
  fastify: FastifyInstance,
) {
  fastify.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const validationResult = notificationTemplateCreateSchema.safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Invalid template payload.",
          error: validationResult.error.issues,
        });
      }

      const { eventId, channel, subject, body } = validationResult.data;

      // Verify event exists
      const event = await fastify.prisma.notificationEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return reply.status(404).send({
          success: false,
          message: "Notification event not found.",
        });
      }

      const template = await fastify.prisma.notificationTemplate.create({
        data: {
          eventId,
          channel,
          subject,
          body,
        },
      });

      return reply.status(201).send({
        success: true,
        message: "Notification template created successfully.",
        data: template,
      });
    }
  );
}

export default notificationTemplateCreate;
