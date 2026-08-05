import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Body {
  moduleName: string;
  moduleKey: string;
}

export default async function createModuleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/module",
    {
      schema: {
        tags: ["Dynamic Engine"],
        body: {
          type: "object",
          required: ["moduleName", "moduleKey"],
          properties: {
            moduleName: { type: "string" },
            moduleKey: { type: "string" },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: Body }>,
      reply: FastifyReply
    ) => {
      const { moduleName, moduleKey } = request.body;

      const exists = await fastify.prisma.dynamicModule.findUnique({
        where: {
          moduleKey,
        },
      });

      if (exists) {
        return reply.code(400).send({
          success: false,
          message: "Module already exists",
        });
      }

      const module = await fastify.prisma.dynamicModule.create({
        data: {
          moduleName,
          moduleKey,
        },
      });

      return reply.send({
        success: true,
        data: module,
      });
    }
  );
}