import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  moduleKey: string;
}

export default async function getSchemaRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/schema/:moduleKey",
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

      const module = await fastify.prisma.dynamicModule.findUnique({
        where: {
          moduleKey,
        },
        include: {
          fields: {
            orderBy: {
              orderNo: "asc",
            },
          },
        },
      });

      if (!module) {
        return reply.code(404).send({
          success: false,
          message: "Module not found",
        });
      }

      return reply.send({
        success: true,
        data: module,
      });
    }
  );
}