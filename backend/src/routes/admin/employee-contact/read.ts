import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read contacts (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee Contact"],
        summary: "Read Employee Contacts",
        description: "Returns employee contacts. If employeeId query param is provided, returns contacts for that employee.",
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
        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { employeeId } = request.query as { employeeId?: string };

        const contacts = await fastify.prisma.employeeContact.findMany({
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
          message: "Employee contacts fetched successfully.",
          data: contacts,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Contacts Failed", { error });
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

  // Read contact by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee Contact"],
        summary: "Read Employee Contact By Id",
        description: "Returns contact details.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
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

        return reply.send({
          success: true,
          data: contact,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Contact By Id Failed", { error });
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

export default readEmployeeContactRoutes;
