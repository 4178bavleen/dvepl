import { FastifyReply, FastifyRequest } from "fastify";

import { AuthService } from "./auth.service";
import { LoginSchema } from "./auth.schema";

const authService = new AuthService();

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validate Request Body
      const body = LoginSchema.parse(request.body);

      // Call Service
      const result = await authService.login(
        body.email,
        body.password,
        request.ip,
        request.headers["user-agent"]
      );

      // Generate Access Token
      const accessToken = request.server.jwt.sign(
        {
          userId: result.user.id,
          companyId: result.user.companyId,
          roles: result.roles,
          permissions: result.permissions,
        },
        {
          expiresIn: "15m",
        }
      );

      // Success Response
      return reply.status(200).send({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message,
      });
    }
  }
}