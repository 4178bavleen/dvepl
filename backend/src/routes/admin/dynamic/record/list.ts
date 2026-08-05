import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  moduleKey: string;
}

export default async function listRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/record/:moduleKey",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply
    ) => {
      const { moduleKey } = request.params;

      const module = await fastify.prisma.dynamicModule.upsert({
        where: {
          moduleKey,
        },
        update: {},
        create: {
          moduleKey,
          moduleName: moduleKey
            .split("-")
            .map(
              word => word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(" "),
        },
      });

      const records = await fastify.prisma.dynamicRecord.findMany({
        where: {
          moduleId: module.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return reply.send({
        success: true,
        data: records,
      });
    }
  );
}