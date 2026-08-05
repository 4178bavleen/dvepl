import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  id: string;
}

export default async function deleteModuleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/module/:id",
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

      const module = await fastify.prisma.dynamicModule.findUnique({
        where: {
          id,
        },
      });

      if (!module) {
        return reply.code(404).send({
          success: false,
          message: "Module not found",
        });
      }

      await fastify.prisma.dynamicModule.delete({
        where: {
          id,
        },
      });

      return reply.send({
        success: true,
        message: "Module deleted successfully",
      });
    }
  );
}