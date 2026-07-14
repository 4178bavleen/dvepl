import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteHolidayRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Holiday"],
        summary: "Delete Holiday",
        description: "Delete a holiday entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        const holiday = await fastify.prisma.holiday.findUnique({
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

        await fastify.prisma.holiday.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Holiday deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          holidayId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Holiday deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Holiday Failed", { error });
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

export default deleteHolidayRoute;
