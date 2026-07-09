import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateHolidaySchema } from "../../../schemas/admin/holiday/holiday.schema";

async function updateHolidayRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Holiday"],
        summary: "Update Holiday",
        description: "Update details of a holiday entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateHolidaySchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validationResult.error.issues,
          });
        }

        const { id } = request.params as { id: string };
        const data = validationResult.data;

        // Check Holiday Exists
        const existingHoliday = await fastify.prisma.holiday.findUnique({
          where: {
            id,
          },
        });

        if (!existingHoliday) {
          return reply.status(404).send({
            success: false,
            message: "Holiday not found.",
          });
        }

        // Check duplicate name if name is changing
        if (data.name && data.name !== existingHoliday.name) {
          const duplicateHoliday = await fastify.prisma.holiday.findFirst({
            where: {
              name: data.name,
            },
          });

          if (duplicateHoliday) {
            return reply.status(409).send({
              success: false,
              message: "Holiday name already exists.",
            });
          }
        }

        const updatedHoliday = await fastify.prisma.holiday.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Holiday updated successfully", {
          updatedBy: (request.user as any)?.id,
          holidayId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Holiday updated successfully.",
          data: updatedHoliday,
        });
      } catch (error: any) {
        adminLogs.error("Update Holiday Failed", { error });
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

export default updateHolidayRoutes;
