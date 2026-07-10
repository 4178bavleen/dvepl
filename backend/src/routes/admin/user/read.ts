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
        //---------------------------------------
        // Company From JWT
        //---------------------------------------

        const companyId = (request.user as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        //---------------------------------------
        // Fetch Users
        //---------------------------------------

        const users = await fastify.prisma.user.findMany({
          where: {
            companyId,
            // deletedAt: null,
          },
          include: {
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
        console.log("users coming from read API " ,users)

        //---------------------------------------
        // Response
        //---------------------------------------

        return reply.status(200).send({
          success: true,
          message: "Users fetched successfully.",
          data: users.map((user) => ({
            id: user.id,
            email: user.email,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            roles: user.userRoles.map((ur) => ({
              id: ur.role.id,
              name: ur.role.name,
            })),
          })),
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