import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeContactRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee Contact"],
        summary: "Delete Employee Contact",
        description: "Delete an employee contact record.",
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

        const contact = await fastify.prisma.employeeContact.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!contact) {
          return reply.status(404).send({
            success: false,
            message: "Employee contact not found.",
          });
        }

        await fastify.prisma.employeeContact.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Employee contact deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          contactId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee contact deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Contact Failed", { error });
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

export default deleteEmployeeContactRoute;
