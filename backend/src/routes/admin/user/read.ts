import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function readUsersRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["User"],
        summary: "Read Users",
        description: "Returns all users of the authenticated company.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.view"]),
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

        const users = await fastify.prisma.user.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            accessProfile: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.status(200).send({
          success: true,
          message: "Users fetched successfully.",
          data: users.map((user) => {
            const up = user.accessProfile;
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              isEmailVerified: user.isEmailVerified,
              isPhoneVerified: user.isPhoneVerified,
              isActive: user.isActive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              role: user.userRoles[0]?.role?.name || "",
              designation: up?.designation || "Team Member",
              pageAccess: up?.pageAccess || [],
              fieldPermissions: up?.fieldPermissions || {},
              actionPermissions: up?.actionPermissions || { create: true, edit: true, delete: false, export: true },
              roles: user.userRoles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.name,
              })),
            };
          }),
        });
      } catch (error: any) {
        adminLogs.error("Read Users failed", {
          error,
        });

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

export default readUsersRoute;
