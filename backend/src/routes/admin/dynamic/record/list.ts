
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  moduleKey: string;
}

export default async function listRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/record/:moduleKey",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{ Params: Params }>,
      reply: FastifyReply,
    ) => {
      try {
        const { moduleKey } = request.params;

        const module = await fastify.prisma.dynamicModule.findUnique({
          where: {
            moduleKey,
          },
        });

        if (!module) {
          return reply.code(404).send({
            success: false,
            message: `Dynamic module '${moduleKey}' not found.`,
          });
        }

        const records = await fastify.prisma.dynamicRecord.findMany({
          where: {
            moduleId: module.id,
          },
          include: {
            inventory: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.send({
          success: true,
          data: records,
        });
      } catch (error) {
        console.error("Failed to list dynamic records:", error);

        return reply.code(500).send({
          success: false,
          message: "Failed to fetch records.",
        });
      }
    },
  );
}

