import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminLoginRoutes from "./login";
import adminLogoutRoute from "./logout"

async function adminAuthRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(adminLoginRoutes, { prefix: "/login" });
  fastify.register(adminLogoutRoute, {
    prefix: "/logout",
  });
}

export default adminAuthRouteGroup;
