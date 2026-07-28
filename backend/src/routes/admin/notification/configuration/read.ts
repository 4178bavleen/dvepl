import {
  FastifyInstance,
  FastifyPluginOptions,
} from "fastify";

async function notificationConfigurationRead(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    async (request, reply) => {
      let configuration =
        await fastify.prisma.notificationConfiguration.findFirst();

      if (!configuration) {
        configuration =
          await fastify.prisma.notificationConfiguration.create({
            data: {},
          });
      }

      return reply.send({
        success: true,
        data: configuration,
      });
    },
  );
}

export default notificationConfigurationRead;