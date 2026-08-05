import {
  FastifyInstance,
  FastifyPluginOptions,
} from "fastify";

export default async function listModuleRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/module",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async () => {
      const modules =
        await fastify.prisma.dynamicModule.findMany({
          orderBy: {
            moduleName: "asc",
          },
        });

      return {
        success: true,
        data: modules,
      };
    }
  );
}