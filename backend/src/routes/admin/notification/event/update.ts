import {
  FastifyInstance,
  FastifyPluginOptions,
} from "fastify";

async function notificationEventUpdate(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.put(
    "/:id",
    async (request: any, reply) => {
      const { id } = request.params;

      const {
        emailEnabled,
        whatsappEnabled,
        isActive,
      } = request.body;

      const event =
        await fastify.prisma.notificationEvent.update({
          where: {
            id,
          },
          data: {
            emailEnabled,
            whatsappEnabled,
            isActive,
          },
        });

      return reply.send({
        success: true,
        message: "Notification event updated successfully.",
        data: event,
      });
    },
  );
}

export default notificationEventUpdate;