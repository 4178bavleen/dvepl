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
  moduleName?: string;
  moduleKey?: string;
}

export default async function updateModuleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/module/:id",
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

      const exists = await fastify.prisma.dynamicModule.findUnique({
        where: { id },
      });

      if (!exists) {
        return reply.code(404).send({
          success: false,
          message: "Module not found",
        });
      }

      if (request.body.moduleKey) {
        const duplicate =
          await fastify.prisma.dynamicModule.findFirst({
            where: {
              moduleKey: request.body.moduleKey,
              NOT: {
                id,
              },
            },
          });

        if (duplicate) {
          return reply.code(400).send({
            success: false,
            message: "Module key already exists",
          });
        }
      }

      const module = await fastify.prisma.dynamicModule.update({
        where: { id },
        data: request.body,
      });

      return reply.send({
        success: true,
        data: module,
      });
    }
  );
}