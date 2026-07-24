import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // Read all employees
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee"],
        summary: "Read Employees",
        description: "Returns all employees of the authenticated company.",
        querystring: {
          type: "object",
          properties: {
            companyId: { type: "string" },
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
        const companyId =
          (request.query as any)?.companyId ||
          (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token or query.",
          });
        }

        const employees = await fastify.prisma.employee.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            designation: {
              select: {
                id: true,
                title: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            contacts: true,
          },
        });

        const mappedEmployees = employees.map((emp) => {
          const emailContact = emp.contacts.find((c) => c.type === "EMAIL");
          return {
            ...emp,
            email: emailContact ? emailContact.value : "",
          };
        });

        return reply.status(200).send({
          success: true,
          message: "Employees fetched successfully.",
          data: mappedEmployees,
        });
      } catch (error: any) {
        adminLogs.error("Read Employees failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );

  // Read employee by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee"],
        summary: "Read Employee By Id",
        description: "Returns employee details.",
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

        const employee = await fastify.prisma.employee.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
          include: {
            contacts: true,
          },
        });

        if (!employee) {
          return reply.status(404).send({
            success: false,
            message: "Employee not found.",
          });
        }

        const emailContact = employee.contacts.find((c) => c.type === "EMAIL");
        const mappedEmployee = {
          ...employee,
          email: emailContact ? emailContact.value : "",
        };

        return reply.send({
          success: true,
          data: mappedEmployee,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee By Id Failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default readEmployeeRoutes;
