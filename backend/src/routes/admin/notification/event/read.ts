import {
  FastifyInstance,
  FastifyPluginOptions,
} from "fastify";

async function notificationEventRead(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    async (request, reply) => {
      const events =
        await fastify.prisma.notificationEvent.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
        });

      return reply.send({
        success: true,
        data: events,
      });
    },
  );
}

export default notificationEventRead;