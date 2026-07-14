import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeDocumentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read document history (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee Document"],
        summary: "Read Employee Document Records",
        description: "Returns employee document records. If employeeId query param is provided, returns document records for that employee.",
        querystring: {
          type: "object",
          properties: {
            employeeId: { type: "string" },
          },
        },
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
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

        const { employeeId } = request.query as { employeeId?: string };

        const documents = await fastify.prisma.employeeDocument.findMany({
          where: {
            employee: {
              companyId,
              deletedAt: null,
            },
            ...(employeeId ? { employeeId } : {}),
          },
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Employee document records fetched successfully.",
          data: documents,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Document Failed", { error });
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

  // Read document record by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee Document"],
        summary: "Read Employee Document By Id",
        description: "Returns details of an employee document record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
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

        return reply.send({
          success: true,
          data: document,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Document By Id Failed", { error });
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

export default readEmployeeDocumentRoutes;
