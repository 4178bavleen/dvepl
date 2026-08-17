import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

async function notificationTemplateDelete(
  fastify: FastifyInstance,
) {
  fastify.delete(
    "/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({
          success: false,
          message: "Notification template not found.",
        });
      }

      await fastify.prisma.notificationTemplate.delete({
        where: { id },
      });

      return reply.send({
        success: true,
        message: "Notification template deleted successfully.",
      });
    }
  );
}

export default notificationTemplateDelete;
