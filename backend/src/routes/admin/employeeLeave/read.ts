import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { LeaveStatus } from "@prisma/client";

async function readLeaveRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Read all valid leave status enum values
  fastify.get(
    "/statuses",
    {
      schema: {
        tags: ["Leave"],
        summary: "Get Valid Leave Statuses",
        description: "Returns the list of valid leave status enum values.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.view"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        success: true,
        data: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      });
    }
  );

  // Read leaves (optionally filtered by employeeId, status)
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Leave"],
        summary: "Read Leave Requests",
        description: "Returns leave requests. Can filter by employeeId and status.",
        querystring: {
          type: "object",
          properties: {
            employeeId: { type: "string" },
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] },
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

        const { employeeId, status } = request.query as {
          employeeId?: string;
          status?: string;
        };

        const leaves = await fastify.prisma.leave.findMany({
          where: {
            employee: {
              companyId,
              deletedAt: null,
            },
            ...(employeeId ? { employeeId } : {}),
            ...(status ? { status: status as LeaveStatus } : {}),
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
          orderBy: {
            fromDate: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Leave requests fetched successfully.",
          data: leaves,
        });
      } catch (error: any) {
        adminLogs.error("Read Leaves Failed", { error });
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

  // Read leave request by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Leave"],
        summary: "Read Leave Request By Id",
        description: "Returns details of a leave request record.",
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

        const leave = await fastify.prisma.leave.findFirst({
          where: {
            id,
            employee: {
              companyId,
              deletedAt: null,
            },
          },
        });

        if (!leave) {
          return reply.status(404).send({
            success: false,
            message: "Leave request not found.",
          });
        }

        return reply.send({
          success: true,
          data: leave,
        });
      } catch (error: any) {
        adminLogs.error("Read Leave By Id Failed", { error });
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

export default readLeaveRoutes;
