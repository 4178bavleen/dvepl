import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

interface Params {
  id: string;
}

export default async function getRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/record/id/:id",
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
        const { id } = request.params;

        const record = await fastify.prisma.dynamicRecord.findUnique({
          where: {
            id,
          },
          include: {
            inventory: true,
          },
        });

        console.log("DYNAMIC RECORD:", record);
        console.log("INVENTORY RELATION:", record?.inventory);
        if (!record) {
          return reply.code(404).send({
            success: false,
            message: "Record not found",
          });
        }

        return reply.send({
          success: true,
          data: record,
        });
      } catch (error) {
        console.error("Failed to get dynamic record:", error);

        return reply.code(500).send({
          success: false,
          message: "Failed to fetch record",
        });
      }
    },
  );
}
