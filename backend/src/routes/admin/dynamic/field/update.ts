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
  label?: string;
  fieldName?: string;
  type?: string;
  required?: boolean;
  options?: any;
  orderNo?: number;
}

export default async function updateFieldRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/field/:id",
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

      const exists = await fastify.prisma.dynamicField.findUnique({
        where: { id },
      });

      if (!exists) {
        return reply.code(404).send({
          success: false,
          message: "Field not found",
        });
      }

      const field = await fastify.prisma.dynamicField.update({
        where: { id },
        data: {
  ...request.body,
  options: request.body.options ?? undefined,
},
      });

      return reply.send({
        success: true,
        data: field,
      });
    }
  );
}