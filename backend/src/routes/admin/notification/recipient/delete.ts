import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function notificationRecipientDelete(
  fastify: FastifyInstance,
) {
  fastify.delete(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.notificationRecipient.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          message: "Notification recipient not found.",
        });
      }

      await fastify.prisma.notificationRecipient.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Notification recipient deleted successfully.",
      });
    }
  );
}

export default notificationRecipientDelete;
