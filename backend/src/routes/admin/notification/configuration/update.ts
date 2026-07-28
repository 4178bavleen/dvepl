import {
  FastifyInstance,
  FastifyPluginOptions,
} from "fastify";

async function notificationConfigurationUpdate(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.put(
    "/",
    async (request: any, reply) => {
      const body = request.body;

      let configuration =
        await fastify.prisma.notificationConfiguration.findFirst();

      if (!configuration) {
        configuration =
          await fastify.prisma.notificationConfiguration.create({
            data: body,
          });
      } else {
        configuration =
          await fastify.prisma.notificationConfiguration.update({
            where: {
              id: configuration.id,
            },
            data: body,
          });
      }

      return reply.send({
        success: true,
        message: "Notification configuration updated successfully.",
        data: configuration,
      });
    },
  );
}

export default notificationConfigurationUpdate;