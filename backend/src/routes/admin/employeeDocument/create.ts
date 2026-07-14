import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { createEmployeeDocumentSchema } from "../../../schemas/admin/employeeDocument/employeeDocument.schema";

async function createEmployeeDocumentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Employee Document"],
        summary: "Create Employee Document",
        description: "Create a new document record for an employee.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = createEmployeeDocumentSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid document data.",
            error: validationResult.error.issues,
          });
        }

        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { employeeId, documentType, fileUrl, fileName } = validationResult.data;

        // Verify employee exists and belongs to company
        const employee = await fastify.prisma.employee.findFirst({
          where: {
            id: employeeId,
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

        const document = await fastify.prisma.employeeDocument.create({
          data: {
            employeeId,
            documentType,
            fileUrl,
            fileName,
          },
        });

        adminLogs.info("Employee document created successfully", {
          createdBy: (request.admin as any)?.id,
          documentId: document.id,
          employeeId,
        });

        return reply.status(201).send({
          success: true,
          message: "Employee document created successfully.",
          data: document,
        });
      } catch (error: any) {
        adminLogs.error("Create Employee Document Failed", { error });
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

export default createEmployeeDocumentRoutes;
