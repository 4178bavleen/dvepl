import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { notificationRecipientCreateSchema } from "../../../../schemas/admin/notification/notification.schema";

async function notificationRecipientCreate(
  fastify: FastifyInstance,
) {
  fastify.post(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const validationResult = notificationRecipientCreateSchema.safeParse(request.body);

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Invalid recipient payload.",
          error: validationResult.error.issues,
        });
      }

      const { eventId, employeeId, email, phone } = validationResult.data;

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

      const recipient = await fastify.prisma.notificationRecipient.create({
        data: {
          eventId,
          employeeId,
          email,
          phone,
        },
      });

      return reply.status(201).send({
        success: true,
        message: "Notification recipient created successfully.",
        data: recipient,
      });
    }
  );
}

export default notificationRecipientCreate;
