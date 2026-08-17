import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function notificationConfigurationRead(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let configuration =
        await fastify.prisma.notificationConfiguration.findFirst();

      if (!configuration) {
        const companyId = (request as any).admin?.companyId;
        const company = await fastify.prisma.company.findFirst();
        configuration =
          await fastify.prisma.notificationConfiguration.create({
            data: {
              companyId: companyId || company?.id || "default",
            },
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