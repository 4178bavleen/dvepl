import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeDocumentRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee Document"],
        summary: "Delete Employee Document",
        description: "Delete an employee document record.",
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

        const document = await fastify.prisma.employeeDocument.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!document) {
          return reply.status(404).send({
            success: false,
            message: "Document record not found.",
          });
        }

        await fastify.prisma.employeeDocument.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Employee document record deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          documentId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee document record deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Document Failed", { error });
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

export default deleteEmployeeDocumentRoute;
