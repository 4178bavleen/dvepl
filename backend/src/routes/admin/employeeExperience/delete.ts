import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeExperienceRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee Experience"],
        summary: "Delete Employee Experience",
        description: "Delete an employee work experience record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
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

        await fastify.prisma.employeeExperience.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Employee experience record deleted successfully", {
          deletedBy: (request.admin as any)?.id,
          experienceId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee experience record deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Experience Failed", { error });
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

export default deleteEmployeeExperienceRoute;
