import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { createUserSchema } from "../../../schemas/user/auth/user.schema";
import { hashPassword } from "../../../utils/hashPassword";

async function createUserRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["User"],
        summary: "Create User",
        description: "Create a new user and assign one or more roles.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ======================================================
        // Validate Request
        // ======================================================
        const validationResult = createUserSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid data for user creation", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid request data.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed.",
          });
        }

        const { email, phone, password, roleIds ,name} =
          validationResult.data;

        // ======================================================
        // Get Company ID From JWT
        // ======================================================
        const companyId = (request.admin as any)?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing from token.",
          });
        }

        // ======================================================
        // Check Duplicate Email
        // ======================================================
        const existingEmail = await fastify.prisma.user.findFirst({
          where: {
            email,
          },
        });

        if (existingEmail) {
          return reply.status(409).send({
            success: false,
            message: "Email already exists.",
          });
        }

        // ======================================================
        // Check Duplicate Phone
        // ======================================================
        if (phone) {
          const existingPhone = await fastify.prisma.user.findFirst({
            where: {
              phone,
            },
          });

          if (existingPhone) {
            return reply.status(409).send({
              success: false,
              message: "Phone number already exists.",
            });
          }
        }

        // ======================================================
        // Validate Roles
        // ======================================================
        let activeRoleIds = roleIds || [];
        if (activeRoleIds.length === 0) {
          const fallbackRole = await fastify.prisma.role.findFirst({
            where: {
              deletedAt: null,
            },
          });
          if (fallbackRole) {
            activeRoleIds = [fallbackRole.id];
          }
        }

        const roles = await fastify.prisma.role.findMany({
          where: {
            id: {
              in: activeRoleIds,
            },
            deletedAt: null,
          },
        });

        if (roles.length !== activeRoleIds.length) {
          return reply.status(400).send({
            success: false,
            message: "One or more selected roles are invalid.",
          });
        }

        // ======================================================
        // Hash Password
        // ======================================================
        const passwordToHash = password || "Dvepl@2026";
        const passwordHash = await hashPassword(passwordToHash);

        // ======================================================
        // Create User + Assign Roles (Transaction)
        // ======================================================
        const createdUser = await fastify.prisma.$transaction(
          async (tx) => {
            const user = await tx.user.create({
              data: {
                companyId,
                name: name || "",
                email,
                phone: phone || null,
                passwordHash,
                isActive: true,
                isEmailVerified: false,
                isPhoneVerified: false,
              },
            });

            await tx.userRole.createMany({
              data: activeRoleIds.map((roleId: string) => ({
                userId: user.id,
                roleId,
              })),
            });

            // Auto-link to existing Employee if their primary/contact email matches
            const employeeContact = await tx.employeeContact.findFirst({
              where: {
                type: "EMAIL",
                value: {
                  equals: email,
                  mode: "insensitive",
                },
              },
            });

            if (employeeContact) {
              await tx.employee.update({
                where: {
                  id: employeeContact.employeeId,
                },
                data: {
                  userId: user.id,
                },
              });
            }

            return user;
          }
        );

        // ======================================================
        // Log
        // ======================================================
        adminLogs.info("User created successfully", {
          createdBy: request.admin?.id,
          userId: createdUser.id,
          companyId,
        });

        // ======================================================
        // Response
        // ======================================================
        return reply.status(201).send({
          success: true,
          message: "User created successfully.",
          data: {
            id: createdUser.id,
            email: createdUser.email,
            phone: createdUser.phone,
          },
        });
      } catch (error: any) {
        adminLogs.error("User creation failed", {
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

export default createUserRoute;