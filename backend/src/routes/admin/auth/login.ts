import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { adminLogs } from "../../../services/logger/contextLogger";
import { loginSchema } from "../../../schemas/admin/auth/auth.schema";
import { getExpiryTime } from "../../../utils/getExpirytime";

const jwtSecret = process.env.JWT_SECRET || "SecretKey";
const jwtExpiration = process.env.JWT_EXPIRATION || "1h";

async function adminLoginRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Auth"],
        summary: "Admin Login",
        description: "Login using email and password",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationResult = loginSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid data for login", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid data for auth.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Invalid credentials",
          });
        }

        const { email, password } = validationResult.data;

        const existingUser = await fastify.prisma.user.findFirst({
          where: {
            email,
            isActive: true,
          },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!existingUser) {
          return reply.status(404).send({
            success: false,
            message: "Invalid email address for authentication",
          });
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          existingUser.passwordHash,
        );

        if (!isPasswordValid) {
          return reply.status(403).send({
            success: false,
            message: "Invalid password",
          });
        }
        const roles = existingUser.userRoles.map((ur) => ur.role.name);

        const permissions = [
          ...new Set(
            existingUser.userRoles.flatMap((ur) =>
              ur.role.rolePermissions.map((rp) => rp.permission.code),
            ),
          ),
        ];

        const token = jwt.sign(
          {
            userId: existingUser.id,
            companyId: existingUser.companyId,
            roles,
            permissions,
            tokenVersion: (existingUser as any).tokenVersion,
          },
          jwtSecret,
          {
            expiresIn: jwtExpiration,
          },
        );
        const expiresAt = getExpiryTime(jwtExpiration);

        adminLogs.info("Admin login attempt", {
          adminId: existingUser.id,
          email: existingUser.email,
        });

        return reply.status(200).send({
          success: true,
          message: "Login successfully",
          token,
          name: (existingUser as any).name,
          expiresAt,
        });
      } catch (error: any) {
        adminLogs.error("Admin login failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error during login. Please try again later.",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    },
  );
}

export default adminLoginRoutes;
