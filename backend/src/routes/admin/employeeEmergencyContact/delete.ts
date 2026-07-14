import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function deleteEmployeeEmergencyContactRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Employee Emergency Contact"],
        summary: "Delete Employee Emergency Contact",
        description: "Delete an employee emergency contact record.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["employee.update"]),
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

        await fastify.prisma.employeeEmergencyContact.delete({
          where: {
            id,
          },
        });

        adminLogs.info("Employee emergency contact deleted successfully", {
          deletedBy: (request.user as any)?.id,
          contactId: id,
        });

        return reply.status(200).send({
          success: true,
          message: "Employee emergency contact deleted successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Delete Employee Emergency Contact Failed", { error });
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

export default deleteEmployeeEmergencyContactRoute;
