import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

import { createTeamSchema } from "../../../schemas/admin/team/team.schema";

async function adminCreateTeamRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post("/create", async (request, reply) => {
    try {
      const body = createTeamSchema.parse(request.body);

      const department = await fastify.prisma.department.findUnique({
        where: {
          id: body.departmentId,
        },
      });

      if (!department) {
        return reply.code(404).send({
          success: false,
          message: "Department not found.",
        });
      }

      const existing = await fastify.prisma.team.findFirst({
        where: {
          departmentId: body.departmentId,
          name: body.name,
          deletedAt: null,
        },
      });

      if (existing) {
        return reply.code(409).send({
          success: false,
          message: "Team already exists in this department.",
        });
      }

      const team = await fastify.prisma.team.create({
        data: {
          departmentId: body.departmentId,
          name: body.name,
          isActive: body.isActive ?? true,
        },
      });

      return reply.code(201).send({
        success: true,
        message: "Team created successfully.",
        data: team,
      });
    } catch (error: any) {
      return reply.code(500).send({
        success: false,
        message: "Failed to create team.",
        details: error.message,
      });
    }
  });
}

export default adminCreateTeamRoute;
