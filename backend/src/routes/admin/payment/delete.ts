import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

interface Params { id: string; }

async function adminPaymentDeleteRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Payment"],
        summary: "Revert a Payment",
        description: "Soft-delete a payment receipt entry to reverse the collected amount",
        params: {
          type: "object",
          properties: { id: { type: "string" } }
        }
      }
    },
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const existing = await fastify.prisma.payment.findUnique({ where: { id } });

        if (!existing || existing.deletedAt) {
          return reply.status(404).send({ success: false, message: "Payment not found" });
        }

        await fastify.prisma.payment.update({
          where: { id },
          data: { deletedAt: new Date() }
        });

        return reply.status(200).send({
          success: true,
          message: "Payment reverted and removed from ledger"
        });
      } catch (error) {
        adminLogs.error("Delete payment error", error);
        return reply.status(500).send({ success: false, message: "Failed to revert payment" });
      }
    }
  );
}

export default adminPaymentDeleteRoutes;
