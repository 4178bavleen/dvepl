import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { adminLogs as AdminLogger } from "../services/logger/contextLogger";

const swaggerSafePaths = ["/docs", "/swagger"];

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    "verifyToken",
    async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
      try {
        // Skip Swagger UI routes
        if (swaggerSafePaths.some((p) => request.url.startsWith(p))) {
          return;
        }

        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
          return reply.status(401).send({ message: "Invalid Token Format" });
        }

        const decoded: any = await request.jwtVerify();

        request.user = {
          id: decoded.id,
          roleType: decoded.roleType,
          tokenVersion: decoded.tokenVersion,
        };
      } catch (error: any) {
        AdminLogger.error(`JWT Verification Failed: ${error}`);

        return reply.status(401).send({
          success: false,
          message: "Invalid or expired token",
        });
      }
    }
  );

  fastify.decorate(
    "authorizeRoles",
    function authorizeRoles(allowedRoles: string[]) {
      return async function (request: FastifyRequest, reply: FastifyReply) {
        try {
          if (swaggerSafePaths.some((p) => request.url.startsWith(p))) {
            return;
          }

          const role = request.user?.roleType;

          if (!role || !allowedRoles.includes(role)) {
            AdminLogger.warn("Unauthorized Role", {
              endpoint: request.url,
              method: request.method,
              role,
            });

            return reply
              .status(403)
              .send({ message: "Access denied: Unauthorized role" });
          }
        } catch (error: any) {
          AdminLogger.error(`Authorization Failed: ${error}`);

          return reply.status(500).send({
            success: false,
            message: "Server error during authorization.",
          });
        }
      };
    }
  );
}

export default fp(authPlugin, {
  name: "auth-plugin",
});
