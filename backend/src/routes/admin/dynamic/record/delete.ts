import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  id: string;
}

export default async function deleteRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/record/:id",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;

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

      await fastify.prisma.dynamicRecord.delete({
        where: {
          id,
        },
      });

      const module = await fastify.prisma.dynamicModule.findUnique({
        where: { id: exists.moduleId },
      });

      if (module?.moduleKey === "inventory") {
        try {
          await fastify.prisma.inventory.updateMany({
            where: { id },
            data: { deletedAt: new Date() },
          });
          await fastify.prisma.material.updateMany({
            where: { id },
            data: { deletedAt: new Date() },
          });
        } catch (syncErr) {
          console.error("Failed to sync delete to static tables:", syncErr);
        }
      }

      return reply.send({
        success: true,
        message: "Record deleted successfully",
      });
    }
  );
}