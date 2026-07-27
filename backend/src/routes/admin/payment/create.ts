import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

interface Body {
  salesOrderId: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  paymentDate?: string;
  remarks?: string;
}

async function adminPaymentCreateRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Payment"],
        summary: "Record a Payment",
        description: "Record a new payment installment against a sales order",
        body: {
          type: "object",
          required: ["salesOrderId", "amount", "paymentMethod"],
          properties: {
            salesOrderId: { type: "string" },
            amount: { type: "number" },
            paymentMethod: { type: "string" },
            referenceNo: { type: "string" },
            paymentDate: { type: "string" },
            remarks: { type: "string" }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: Body }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { salesOrderId, amount, paymentMethod, referenceNo, paymentDate, remarks } = request.body;

        // Validate order exists
        const order = await fastify.prisma.salesOrder.findUnique({
          where: { id: salesOrderId },
          include: { payments: { where: { deletedAt: null }, select: { amount: true } } }
        });

        if (!order) {
          return reply.status(404).send({ success: false, message: "Sales order not found" });
        }

        // Check if payment exceeds outstanding balance
        const totalAmount = Number(order.grandTotal || 0);
        const alreadyReceived = order.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const outstanding = Math.max(0, totalAmount - alreadyReceived);

        if (amount > outstanding) {
          return reply.status(400).send({
            success: false,
            message: `Payment amount (₹${amount}) exceeds outstanding balance (₹${outstanding})`
          });
        }

        // Generate unique paymentNo
        const paymentNo = `PAY-${Date.now()}`;

        const payment = await fastify.prisma.payment.create({
          data: {
            paymentNo,
            salesOrderId,
            companyId: order.companyId,
            amount,
            paymentMethod: paymentMethod as any,
            referenceNo: referenceNo || null,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            remarks: remarks || null,
            receivedById: user.id
          }
        });

        return reply.status(201).send({
          success: true,
          message: "Payment recorded successfully",
          data: {
            id: payment.id,
            amount: Number(payment.amount),
            mode: payment.paymentMethod,
            ref: payment.referenceNo || "N/A",
            date: payment.paymentDate.toISOString().split("T")[0],
            note: payment.remarks || ""
          }
        });
      } catch (error) {
        adminLogs.error("Create payment error", error);
        return reply.status(500).send({ success: false, message: "Failed to record payment" });
      }
    }
  );
}

export default adminPaymentCreateRoutes;
