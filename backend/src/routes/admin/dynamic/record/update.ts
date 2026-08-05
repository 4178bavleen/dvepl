import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  id: string;
}

interface Body {
  values: Record<string, any>;
}

export default async function updateRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/record/:id",
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
      const { id } = request.params;

      const { values } = request.body;

      const exists =
        await fastify.prisma.dynamicRecord.findUnique({
          where: {
            id,
          },
        });

      if (!exists) {
        return reply.code(404).send({
          success: false,
          message: "Record not found",
        });
      }

      const updated =
        await fastify.prisma.dynamicRecord.update({
          where: {
            id,
          },
          data: {
            values,
          },
        });

      return reply.send({
        success: true,
        data: updated,
      });
    }
  );
}