import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function notificationRecipientRead(
  fastify: FastifyInstance,
) {
  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { eventId } = request.query as { eventId?: string };

      const where: any = {};
      if (eventId) {
        where.eventId = eventId;
      }

      const recipients = await fastify.prisma.notificationRecipient.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          event: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      });

      return reply.send({
        success: true,
        data: recipients,
      });
    }
  );
}

export default notificationRecipientRead;
