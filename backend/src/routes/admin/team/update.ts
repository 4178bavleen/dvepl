import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";
import { updateTeamSchema } from "../../../schemas/admin/team/team.schema";

interface Params {
  id: string;
}

async function updateTeamRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Team"],
        summary: "Update Team",
        description: "Update details of an existing team.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
      ],
    },

    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params as Params;
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const validationResult = updateTeamSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid team update data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid team data.",
            error: validationResult.error.issues,
          });
        }

        const { departmentId, name, isActive } = validationResult.data;

        // Verify team exists and belongs to this company
        const existingTeam = await fastify.prisma.team.findFirst({
          where: {
            id,
            deletedAt: null,
            department: {
              branch: {
                companyId,
              },
            },
          },
        });

        if (!existingTeam) {
          return reply.status(404).send({
            success: false,
            message: "Team not found.",
          });
        }

        // Verify department if departmentId is changing
        if (departmentId && departmentId !== existingTeam.departmentId) {
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
        }

        // Verify team name uniqueness in the target department
        if (name || departmentId) {
          const targetDeptId = departmentId || existingTeam.departmentId;
          const targetName = name || existingTeam.name;

          const duplicateTeam = await fastify.prisma.team.findFirst({
            where: {
              departmentId: targetDeptId,
              name: targetName,
              deletedAt: null,
              NOT: {
                id,
              },
            },
          });

          if (duplicateTeam) {
            return reply.status(409).send({
              success: false,
              message: "Team name already exists for this department.",
            });
          }
        }

        const updatedTeam = await fastify.prisma.team.update({
          where: {
            id,
          },
          data: {
            departmentId,
            name,
            isActive,
          },
        });

        adminLogs.info("Team updated successfully", {
          teamId: updatedTeam.id,
          updatedBy: request.admin?.id,
        });

        return reply.status(200).send({
          success: true,
          message: "Team updated successfully.",
          data: updatedTeam,
        });
      } catch (error: any) {
        adminLogs.error("Team update failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while updating team.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default updateTeamRoutes;
