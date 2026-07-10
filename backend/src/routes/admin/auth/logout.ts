import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function adminLogoutRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      preHandler: [fastify.verifyToken],
      schema: {
        tags: ["Auth"],
        summary: "Admin Logout",
        description: "Logout authenticated user",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.userId;

        if (!userId) {
          return reply.status(401).send({
            success: false,
            message: "Unauthorized",
          });
        }

        // Invalidate all existing tokens
        await fastify.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            tokenVersion: {
              increment: 1,
            },
          },
        });

        return reply.send({
          success: true,
          message: "Logged out successfully.",
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          message: error.message,
        });
      }
    }
  );
}

export default adminLogoutRoutes;