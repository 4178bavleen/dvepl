import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  id: string;
}

export default async function deleteFieldRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/field/:id",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
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

      await fastify.prisma.dynamicField.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Field deleted successfully",
      });
    }
  );
}