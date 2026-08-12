import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { fetchAwardTenders } from "../../../services/quoteTender.service";

async function quoteTenderOrderReadRoutes(
  fastify: FastifyInstance,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Quote Tender Order"],
        summary: "Read Orders from Quote Tender Portal",
      },
    },
    async (
      _request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      try {
        const awardTenders = await fetchAwardTenders();

        return reply.status(200).send({
          success: true,
          message: "Quote Tender Orders fetched successfully.",
          data: awardTenders,
        });
      } catch (error: any) {
        fastify.log.error(error);

        return reply.status(502).send({
          success: false,
          message: "Failed to fetch orders from Quote Tender Portal.",
          error: error.message,
        });
      }
    },
  );
}

export default quoteTenderOrderReadRoutes;