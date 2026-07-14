import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeShiftRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee Shift Assignment"],
        summary: "Delete Employee Shift Assignment",
        description: "Delete an employee shift assignment record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        const assignment = await fastify.prisma.employeeShift.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!assignment) {
          return reply.status(404).send({
            success: false,
            message: "Shift assignment not found.",
          });
        }

        await fastify.prisma.employeeShift.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Employee shift assignment deleted successfully", {
          deletedBy: (request.user as any)?.id,
          assignmentId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee shift assignment deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Shift Assignment Failed", { error });
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

export default deleteEmployeeShiftRoute;
