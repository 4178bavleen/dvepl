import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readHolidayRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read holidays
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Holiday"],
        summary: "Read Holidays",
        description: "Returns holidays. Optionally filter by year.",
        querystring: {
          type: "object",
          properties: {
            year: { type: "integer" },
          },
        },
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { year } = request.query as { year?: number };

        let whereClause: any = {};
        if (year) {
          const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
          const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
          whereClause.date = {
            gte: startDate,
            lte: endDate,
          };
        }

        const holidays = await fastify.prisma.holiday.findMany({
          where: whereClause,
          orderBy: {
            date: "asc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Holidays fetched successfully.",
          data: holidays,
        });
      } catch (error: any) {
        adminLogs.error("Read Holidays Failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );

  // Read holiday by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Holiday"],
        summary: "Read Holiday By Id",
        description: "Returns details of a holiday entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const holiday = await fastify.prisma.holiday.findFirst({
          where: {
            id,
          },
        });

        if (!holiday) {
          return reply.status(404).send({
            success: false,
            message: "Holiday not found.",
          });
        }

        return reply.send({
          success: true,
          data: holiday,
        });
      } catch (error: any) {
        adminLogs.error("Read Holiday By Id Failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default readHolidayRoutes;
