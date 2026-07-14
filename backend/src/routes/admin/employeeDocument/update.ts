import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateEmployeeDocumentSchema } from "../../../schemas/admin/employeeDocument/employeeDocument.schema";

async function updateEmployeeDocumentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Employee Document"],
        summary: "Update Employee Document",
        description: "Update details of an employee document record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateEmployeeDocumentSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error: validationResult.error.issues,
          });
        }

        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };
        const data = validationResult.data;

        // Check Document Record Exists and belongs to company
        const existingDocument = await fastify.prisma.employeeDocument.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!existingDocument) {
          return reply.status(404).send({
            success: false,
            message: "Document record not found.",
          });
        }

        // If employeeId is changing, verify that new employee exists and belongs to company
        if (data.employeeId && data.employeeId !== existingDocument.employeeId) {
          const newEmployee = await fastify.prisma.employee.findFirst({
            where: {
              id: data.employeeId,
              companyId,
              deletedAt: null,
            },
          });

          if (!newEmployee) {
            return reply.status(400).send({
              success: false,
              message: "Invalid employee ID.",
            });
          }
        }

        const updatedDocument = await fastify.prisma.employeeDocument.update({
          where: {
            id,
          },
          data,
        });

        adminLogs.info("Employee document updated successfully", {
          updatedBy: (request.user as any)?.id,
          documentId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee document updated successfully.",
          data: updatedDocument,
        });
      } catch (error: any) {
        adminLogs.error("Update Employee Document Failed", { error });
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

export default updateEmployeeDocumentRoutes;
