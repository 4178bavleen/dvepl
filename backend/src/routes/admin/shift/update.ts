import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateShiftSchema } from "../../../schemas/admin/shift/shift.schema";

async function updateShiftRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Shift"],
        summary: "Update Shift",
        description: "Update details of a shift definition.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateShiftSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validationResult.error.issues,
          });
        }

        const { id } = request.params as { id: string };
        const data = validationResult.data;

        // Check Shift Exists
        const existingShift = await fastify.prisma.shift.findFirst({
          where: {
            id,
            deletedAt: null,
          },
        });

        if (!existingShift) {
          return reply.status(404).send({
            success: false,
            message: "Shift not found.",
          });
        }

        // Check duplicate name if name is changing
        if (data.name && data.name !== existingShift.name) {
          const duplicateShift = await fastify.prisma.shift.findFirst({
            where: {
              name: data.name,
              deletedAt: null,
            },
          });

          if (duplicateShift) {
            return reply.status(409).send({
              success: false,
              message: "Shift name already exists.",
            });
          }
        }

        const updatedShift = await fastify.prisma.shift.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Shift updated successfully", {
          updatedBy: (request.admin as any)?.id,
          shiftId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Shift updated successfully.",
          data: updatedShift,
        });
      } catch (error: any) {
        adminLogs.error("Update Shift Failed", { error });
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

export default updateShiftRoutes;
