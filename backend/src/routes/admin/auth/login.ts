import hashUtil from "../../../utils/hashPassword";
import loginSchema from "../../../schemas/admin/auth/auth.schema";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

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

        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request: any, reply: any) => {
      try {
        const validationResult = loginSchema.safeParse(request.body);
        if (!validationResult.success) {
          fastify.adminLogger.error("Invalid data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid data for auth.",
          });
        }

        const { email, password } = validationResult.data;

        fastify.adminLogger.error(`Login Attmpted ${email}`);

        const existingAdmin = await fastify.prisma.admin.findUnique({
          where: { email },
          include: {
            role: true,
          },
        });

        if (!existingAdmin) {
          return reply.status(401).send({
            success: false,
            message: "Invalid Email Address.",
          });
        }

        const isMatch = await hashUtil.comparePassword(
          password,
          existingAdmin.password,
        );

        if (!isMatch) {
          return reply.status(401).send({
            success: false,
            message: "Invalid Password",
          });
        }

        const token = fastify.jwt.sign(
          {
            id: existingAdmin.id,
            roleType: existingAdmin.role?.roleType ?? null,
            tokenVersion: existingAdmin.tokenVersion,
          },
          {
            expiresIn: process.env.JWT_EXPIRATION || "1h",
          },
        );

        fastify.adminLogger.info(`Admin logged in: ${email}`);

        reply.send({
          success: true,
          message: "Login successful",
          token,
        });
      } catch (error: string | any) {
        fastify.adminLogger.error(`Login failed ${error}`);
        return reply.status(500).send({
          success: false,
          message: "Server error during login. Please try again later.",
          details:
            process.env.NODE_ENV === "development" ? error.message : error.message,
        });
      }
    },
  );
}

export default adminLoginRoutes;
