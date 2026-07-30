import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { Prisma } from "@prisma/client";

import { adminLogs } from "../../../../services/logger/contextLogger";
import { updateUserSchema } from "../../../../schemas/user/auth/update-user.schema";

async function updateProfileRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.patch(
    "/",
    {
      preHandler: [fastify.verifyToken],
      schema: {
        tags: ["Auth"],
        summary: "Update Logged-in User Profile",
        description: "Update profile of currently logged-in user.",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = updateUserSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid profile data.",
            error: validationResult.error.issues,
          });
        }

        const userId = (request.admin as any).id;

        const { name, phone } = validationResult.data;

        const user = await fastify.prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

        if (!user || user.deletedAt) {
          return reply.status(404).send({
            success: false,
            message: "User not found.",
          });
        }

        const updatedUser = await fastify.prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            name,
            phone: phone && phone.trim() !== "" ? phone.trim() : null,
          },
        });

        adminLogs.info("Profile updated", {
          userId,
        });

        return reply.status(200).send({
          success: true,
          message: "Profile updated successfully.",
          data: updatedUser,
        });
      } catch (error: any) {
        adminLogs.error("Profile update failed", {
          error,
        });

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002" && (error.meta?.target as string[])?.includes("phone")) {
            return reply.status(400).send({
              success: false,
              message: "This phone number is already in use by another user.",
            });
          }
        }

        return reply.status(500).send({
          success: false,
          message: "Server error while updating profile.",
          details: error.message,
        });
      }
    },
  );
}

export default updateProfileRoute;