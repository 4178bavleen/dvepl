import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteLeaveRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Leave"],
        summary: "Delete Leave Request",
        description: "Delete an employee leave request record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        const leave = await fastify.prisma.leave.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!leave) {
          return reply.status(404).send({
            success: false,
            message: "Leave request not found.",
          });
        }

        await fastify.prisma.leave.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Leave request deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          leaveId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Leave request deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Leave Failed", { error });
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

export default deleteLeaveRoute;
