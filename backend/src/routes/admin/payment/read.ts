import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

interface Query {
  salesOrderId?: string;
  page?: string;
  limit?: string;
}

async function adminPaymentReadRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /admin/payment/read?salesOrderId=:id  -- payment history for a specific order
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Payment"],
        summary: "Get Payments for an Order",
        description: "Fetch payment installments for a sales order",
        querystring: {
          type: "object",
          properties: {
            salesOrderId: { type: "string" },
            page: { type: "string" },
            limit: { type: "string" }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: Query }>, reply: FastifyReply) => {
      try {
        const { salesOrderId, page = "1", limit = "100" } = request.query;

        const where: any = { deletedAt: null };
        if (salesOrderId) {
          where.salesOrderId = salesOrderId;
        }

        const payments = await fastify.prisma.payment.findMany({
          where,
          orderBy: { paymentDate: "asc" },
          include: {
            receivedBy: { select: { id: true, name: true } }
          },
          take: Number(limit),
          skip: (Number(page) - 1) * Number(limit)
        });

        return reply.status(200).send({
          success: true,
          data: payments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            mode: p.paymentMethod,
            ref: p.referenceNo || "N/A",
            date: p.paymentDate instanceof Date ? p.paymentDate.toISOString().split("T")[0] : String(p.paymentDate).split("T")[0],
            note: p.remarks || "",
            receivedBy: (p as any).receivedBy?.name || null
          })),
          total: payments.length
        });
      } catch (error) {
        adminLogs.error("Get payments error", error);
        return reply.status(500).send({ success: false, message: "Failed to fetch payments" });
      }
    }
  );

  // GET /admin/payment/read/orders  -- finance list: all orders with received/balance totals
  fastify.get(
    "/orders",
    {
      schema: {
        tags: ["Payment"],
        summary: "Finance Order Summary",
        description: "Fetch all sales orders with computed received and balance amounts",
        querystring: {
          type: "object",
          properties: {
            search: { type: "string" },
            status: { type: "string" },
            limit: { type: "string" },
            page: { type: "string" }
          }
        }
      }
    },
    async (
      request: FastifyRequest<{ Querystring: { search?: string; status?: string; page?: string; limit?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { search, status, page = "1", limit = "100" } = request.query;

        const where: any = { deletedAt: null };
        if (status) where.status = status.toUpperCase();
        if (search) {
          where.OR = [
            { dveplCode: { contains: search, mode: "insensitive" } },
            { partyName: { contains: search, mode: "insensitive" } }
          ];
        }

        const orders = await fastify.prisma.salesOrder.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: Number(limit),
          skip: (Number(page) - 1) * Number(limit),
          include: {
            customer: { select: { id: true, name: true } },
            payments: { where: { deletedAt: null }, select: { amount: true } }
          }
        });

        const data = orders.map((o: any) => {
          const totalAmount = Number(o.grandTotal || 0);
          const received = o.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          const balance = Math.max(0, totalAmount - received);
          const status = String(o.status).toLowerCase().replace("_", "-");

          return {
            id: o.id,
            dveplCode: o.dveplCode,
            customerName: o.partyName || o.customer?.name || "Unknown",
            vendorName: (o as any).orderPlaceTo || "—",
            orderDate: o.orderConfirmDate ? String(o.orderConfirmDate).split("T")[0] : String(o.createdAt).split("T")[0],
            totalAmount,
            received,
            balance,
            status: status === "in_progress" ? "in-progress" : status,
            paymentCount: o.payments.length
          };
        });

        return reply.status(200).send({ success: true, data, total: data.length });
      } catch (error) {
        adminLogs.error("Finance orders list error", error);
        return reply.status(500).send({ success: false, message: "Failed to fetch finance orders" });
      }
    }
  );
}

export default adminPaymentReadRoutes;
