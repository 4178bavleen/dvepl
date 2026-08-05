import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  moduleKey: string;
}

interface Body {
  values: Record<string, any>;
}

export default async function createRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/record/:moduleKey",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
        Body: Body;
      }>,
      reply: FastifyReply
    ) => {
      const { moduleKey } = request.params;
      const { values } = request.body;

      const module = await fastify.prisma.dynamicModule.findUnique({
        where: {
          moduleKey,
        },
      });

      if (!module) {
        return reply.code(404).send({
          success: false,
          message: "Module not found",
        });
      }

      const record = await fastify.prisma.dynamicRecord.create({
        data: {
          moduleId: module.id,
          values,
        },
      });

      return reply.send({
        success: true,
        data: record,
      });
    }
  );
}