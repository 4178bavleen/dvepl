import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { updateUserSchema } from "../../../schemas/user/auth/update-user.schema";

async function updateUserRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["User"],
        summary: "Update User",
        description: "Update user details and assigned roles.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.update"]),
      ],
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        //----------------------------------------
        // Validate Request
        //----------------------------------------

        const validationResult = updateUserSchema.safeParse(request.body);

        if (!validationResult.success) {
          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed.",
          });
        }

        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        const { id } = request.params as { id: string };

        const { email, phone, isActive, roleIds } =
          validationResult.data;

        //----------------------------------------
        // Check User Exists
        //----------------------------------------

        const existingUser = await fastify.prisma.user.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },
        });

        if (!existingUser) {
          return reply.status(404).send({
            success: false,
            message: "User not found.",
          });
        }

        //----------------------------------------
        // Duplicate Email
        //----------------------------------------

        const duplicateEmail = await fastify.prisma.user.findFirst({
          where: {
            email,
            NOT: {
              id,
            },
            deletedAt: null,
          },
        });

        if (duplicateEmail) {
          return reply.status(409).send({
            success: false,
            message: "Email already exists.",
          });
        }

        //----------------------------------------
        // Duplicate Phone
        //----------------------------------------

        if (phone) {
          const duplicatePhone = await fastify.prisma.user.findFirst({
            where: {
              phone,
              NOT: {
                id,
              },
              deletedAt: null,
            },
          });

          if (duplicatePhone) {
            return reply.status(409).send({
              success: false,
              message: "Phone number already exists.",
            });
          }
        }

        //----------------------------------------
        // Validate Roles
        //----------------------------------------

        const roles = await fastify.prisma.role.findMany({
          where: {
            id: {
              in: roleIds,
            },
            companyId,
            deletedAt: null,
          },
        });

        if (roles.length !== roleIds.length) {
          return reply.status(400).send({
            success: false,
            message: "One or more selected roles are invalid.",
          });
        }

        //----------------------------------------
        // Transaction
        //----------------------------------------

        await fastify.prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: {
              id,
            },
            data: {
              email,
              phone,
              isActive,
            },
          });

          await tx.userRole.deleteMany({
            where: {
              userId: id,
            },
          });

          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        });

        return reply.status(200).send({
          success: true,
          message: "User updated successfully.",
        });
      } catch (error: any) {
        adminLogs.error("Update User Failed", {
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

export default updateUserRoute;