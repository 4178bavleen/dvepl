import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee"],
        summary: "Delete Employee",
        description: "Soft delete an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.delete"]),
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

        const employee = await fastify.prisma.employee.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!employee) {
          return reply.status(404).send({
            success: false,
            message: "Employee not found.",
          });
        }

        await fastify.prisma.employee.update({
          where: {
            id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        adminLogs.info("Employee deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          employeeId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Failed", { error });
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

export default deleteEmployeeRoute;
