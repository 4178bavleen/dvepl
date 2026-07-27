import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

interface Params { id: string; }

interface Body {
  amount?: number;
  paymentMethod?: string;
  referenceNo?: string;
  paymentDate?: string;
  remarks?: string;
}

async function adminPaymentUpdateRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Payment"],
        summary: "Update a Payment Entry",
        description: "Modify the details of an existing payment receipt",
        params: {
          type: "object",
          properties: { id: { type: "string" } }
        },
        body: {
          type: "object",
          properties: {
            amount: { type: "number" },
            paymentMethod: { type: "string" },
            referenceNo: { type: "string" },
            paymentDate: { type: "string" },
            remarks: { type: "string" }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: Params; Body: Body }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { amount, paymentMethod, referenceNo, paymentDate, remarks } = request.body;

        const existing = await fastify.prisma.payment.findUnique({
          where: { id },
          include: {
            salesOrder: {
              include: { payments: { where: { deletedAt: null }, select: { id: true, amount: true } } }
            }
          }
        });

        if (!existing || existing.deletedAt) {
          return reply.status(404).send({ success: false, message: "Payment not found" });
        }

        // If amount is being updated, validate against max permissible
        if (amount !== undefined && existing.salesOrder) {
          const totalAmount = Number((existing.salesOrder as any).grandTotal || 0);
          const otherPaymentsSum = (existing.salesOrder as any).payments
            .filter((p: any) => p.id !== id)
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          const maxPermissible = Math.max(0, totalAmount - otherPaymentsSum);

          if (amount > maxPermissible) {
            return reply.status(400).send({
              success: false,
              message: `Updated amount (₹${amount}) exceeds the permissible limit (₹${maxPermissible})`
            });
          }
        }

        const updated = await fastify.prisma.payment.update({
          where: { id },
          data: {
            ...(amount !== undefined && { amount }),
            ...(paymentMethod && { paymentMethod: paymentMethod as any }),
            ...(referenceNo !== undefined && { referenceNo }),
            ...(paymentDate && { paymentDate: new Date(paymentDate) }),
            ...(remarks !== undefined && { remarks })
          }
        });

        return reply.status(200).send({
          success: true,
          message: "Payment updated successfully",
          data: {
            id: updated.id,
            amount: Number(updated.amount),
            mode: updated.paymentMethod,
            ref: updated.referenceNo || "N/A",
            date: updated.paymentDate.toISOString().split("T")[0],
            note: updated.remarks || ""
          }
        });
      } catch (error) {
        adminLogs.error("Update payment error", error);
        return reply.status(500).send({ success: false, message: "Failed to update payment" });
      }
    }
  );
}

export default adminPaymentUpdateRoutes;
