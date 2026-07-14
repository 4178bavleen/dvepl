import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeEmergencyContactRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read contacts (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee Emergency Contact"],
        summary: "Read Employee Emergency Contacts",
        description: "Returns employee emergency contacts. If employeeId query param is provided, returns contacts for that employee.",
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

        const contacts = await fastify.prisma.employeeEmergencyContact.findMany({
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
          message: "Employee emergency contacts fetched successfully.",
          data: contacts,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Emergency Contacts Failed", { error });
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
        tags: ["Employee Emergency Contact"],
        summary: "Read Employee Emergency Contact By Id",
        description: "Returns emergency contact details.",
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

        const contact = await fastify.prisma.employeeEmergencyContact.findFirst({
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
            message: "Employee emergency contact not found.",
          });
        }

        return reply.send({
          success: true,
          data: contact,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Emergency Contact By Id Failed", { error });
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

export default readEmployeeEmergencyContactRoutes;
