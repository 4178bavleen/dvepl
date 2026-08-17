import { FastifyInstance, FastifyPluginOptions } from "fastify";
import readAuditLogRoutes from "./read";

async function adminAuditLogRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(readAuditLogRoutes, { prefix: "/read" });
}

export default adminAuditLogRouteGroup;
