import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readEmployeeExperienceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read experience history (optionally filtered by employeeId)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Employee Experience"],
        summary: "Read Employee Experience Records",
        description: "Returns employee experience records. If employeeId query param is provided, returns experience records for that employee.",
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

        const experience = await fastify.prisma.employeeExperience.findMany({
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
          message: "Employee experience records fetched successfully.",
          data: experience,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Experience Failed", { error });
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

  // Read experience record by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Employee Experience"],
        summary: "Read Employee Experience By Id",
        description: "Returns details of an employee experience record.",
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

        const experience = await fastify.prisma.employeeExperience.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!experience) {
          return reply.status(404).send({
            success: false,
            message: "Experience record not found.",
          });
        }

        return reply.send({
          success: true,
          data: experience,
        });
      } catch (error: any) {
        adminLogs.error("Read Employee Experience By Id Failed", { error });
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

export default readEmployeeExperienceRoutes;
