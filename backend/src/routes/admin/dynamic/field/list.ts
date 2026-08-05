import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Query {
  moduleId?: string;
  moduleKey?: string;
}

export default async function listFieldRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/field",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{ Querystring: Query }>,
      reply: FastifyReply
    ) => {
      const { moduleId, moduleKey } = request.query;

      let resolvedModuleId = moduleId;

      if (!resolvedModuleId && moduleKey) {
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

        resolvedModuleId = module.id;
      }

      if (!resolvedModuleId) {
        return reply.code(400).send({
          success: false,
          message: "moduleId or moduleKey is required",
        });
      }

      const fields = await fastify.prisma.dynamicField.findMany({
        where: {
          moduleId: resolvedModuleId,
        },
        orderBy: {
          orderNo: "asc",
        },
      });

      return reply.send({
        success: true,
        data: fields,
      });
    }
  );
}