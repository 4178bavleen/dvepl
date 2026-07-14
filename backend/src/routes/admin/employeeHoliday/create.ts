import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createHolidaySchema } from "../../../schemas/admin/employeeHoliday/holiday.schema";

async function createHolidayRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Holiday"],
        summary: "Create Holiday",
        description: "Create a new holiday entry.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createHolidaySchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid holiday data.",
            error: validationResult.error.issues,
          });
        }

        const { name, date, type } = validationResult.data;

        // Check for duplicate name
        const existingHoliday = await fastify.prisma.holiday.findFirst({
          where: {
            name,
          },
        });

        if (existingHoliday) {
          return reply.status(409).send({
            success: false,
            message: "Holiday with this name already exists.",
          });
        }

        const holiday = await fastify.prisma.holiday.create({
          data: {
            name,
            date,
            type,
          },
        });

        adminLogs.info("Holiday created successfully", {
          createdBy: (request.admin as any)?.id,
          holidayId: holiday.id,
          name,
        });

        return reply.status(201).send({
          success: true,
          message: "Holiday created successfully.",
          data: holiday,
        });
      } catch (error: any) {
        adminLogs.error("Create Holiday Failed", { error });
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

export default createHolidayRoutes;
