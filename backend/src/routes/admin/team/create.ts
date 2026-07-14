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
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Team"],
        summary: "Create Team",
        description: "Create a new team under a department.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const validationResult = createTeamSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid team data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid team data.",
            error: validationResult.error.issues,
          });
        }

        const { departmentId, name, isActive } = validationResult.data;

        // Verify department exists and belongs to this company
        const department = await fastify.prisma.department.findFirst({
          where: {
            id: departmentId,
            branch: {
              companyId,
            },
            deletedAt: null,
          },
        });

        if (!department) {
          return reply.status(404).send({
            success: false,
            message: "Department not found.",
          });
        }

        // Verify team name is unique in this department
        const existingTeam = await fastify.prisma.team.findFirst({
          where: {
            departmentId,
            name,
            deletedAt: null,
          },
        });

        if (existingTeam) {
          return reply.status(409).send({
            success: false,
            message: "Team already exists in this department.",
          });
        }

        const team = await fastify.prisma.team.create({
          data: {
            departmentId,
            name,
            isActive: isActive ?? true,
          },
        });

        adminLogs.info("Team created successfully", {
          teamId: team.id,
          createdBy: request.admin?.id,
        });

        return reply.status(201).send({
          success: true,
          message: "Team created successfully.",
          data: team,
        });
      } catch (error: any) {
        adminLogs.error("Failed to create team", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating team.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default adminCreateTeamRoute;
