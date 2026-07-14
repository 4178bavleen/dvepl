import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminLoginRoutes from "./login";
import adminLogoutRoute from "./logout"
import adminProfileRoutes from "./profile"

async function adminAuthRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(adminLoginRoutes, { prefix: "/login" });
  fastify.register(adminLogoutRoute, {
    prefix: "/logout",
  });
  fastify.register(adminProfileRoutes, {
    prefix: "/profile",
  });
}

export default adminAuthRouteGroup;
