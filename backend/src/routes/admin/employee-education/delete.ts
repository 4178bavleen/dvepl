import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeEducationRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee Education"],
        summary: "Delete Employee Education",
        description: "Delete an employee education record.",
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

        const education = await fastify.prisma.employeeEducation.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!education) {
          return reply.status(404).send({
            success: false,
            message: "Education record not found.",
          });
        }

        await fastify.prisma.employeeEducation.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Employee education record deleted successfully", {
          deletedBy: (request.user as any)?.id,
          educationId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee education record deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Education Failed", { error });
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

export default deleteEmployeeEducationRoute;
