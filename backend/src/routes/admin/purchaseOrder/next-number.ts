import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function adminPurchaseOrderNextNumberRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Get next available Purchase Order number",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;
        const prefix = `PO-${new Date().getFullYear()}-`;

        // Include soft-deleted rows: poNo has a DB-level unique constraint,
        // so recycled orders still own their numbers.
        const rows = await fastify.prisma.purchaseOrder.findMany({
          where: {
            companyId,
            poNo: { startsWith: prefix },
          },
          select: { poNo: true },
        });

        let nextNum = 1;
        for (const row of rows) {
          const parsed = parseInt(row.poNo.slice(prefix.length), 10);
          if (!isNaN(parsed) && parsed >= nextNum) {
            nextNum = parsed + 1;
          }
        }

        return reply.send({
          success: true,
          data: `${prefix}${String(nextNum).padStart(4, "0")}`,
        });
      } catch (error: any) {
        console.error(error);
        return reply.status(500).send({
          success: false,
          message: "Failed to generate next PO number.",
          error: error.message,
        });
      }
    },
  );
}

export default adminPurchaseOrderNextNumberRoutes;
