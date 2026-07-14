import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminLoginRoutes from "./login";
import adminLogoutRoute from "./logout"
import profileRoutes from "./profile"

async function adminAuthRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(adminLoginRoutes, { prefix: "/login" });
  fastify.register(adminLogoutRoute, {
    prefix: "/logout",
  });
  fastify.register(profileRoutes, {
    prefix: "/profile",
  });
}

export default adminAuthRouteGroup;
