import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function notificationTemplateRead(
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

      const templates = await fastify.prisma.notificationTemplate.findMany({
        where,
        include: {
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
        data: templates,
      });
    }
  );
}

export default notificationTemplateRead;
